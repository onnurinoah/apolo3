import { NextRequest, NextResponse } from "next/server";
import { allQuestions } from "@/data/questions";
import { getOpenAIClient } from "@/lib/openai";
import { getApologeticsPrompt, ApologeticsLength } from "@/lib/prompts";
import { findBestQuestionMatch, searchQuestionsWithScore } from "@/lib/search";

function normalizeLength(raw: unknown): ApologeticsLength {
  return raw === "detailed" ? "detailed" : "concise";
}

function toConcise(text: string): string {
  const chunks = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?]|다\.|요\.|니다\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (chunks.length <= 2) return text;
  return `${chunks.slice(0, 2).join(" ")}`;
}

function toDetailed(primary: string, support?: string): string {
  if (!support || support === primary) {
    return primary;
  }
  return `${primary}\n\n핵심 근거 정리\n${support}`;
}

function buildAiGuide(length: ApologeticsLength): string {
  if (length === "detailed") {
    return [
      "출력 형식:",
      "1) 한줄답",
      "2) 핵심 이유 3가지 (각 1-2문장)",
      "3) 오해 바로잡기 1가지",
      "4) 대화에서 바로 쓰는 한 문장",
      "문장은 쉽고 짧게 작성하세요.",
    ].join("\n");
  }

  return [
    "출력 형식:",
    "1) 한줄답",
    "2) 핵심 이유 2가지",
    "3) 대화에서 바로 쓰는 한 문장",
    "문장은 쉽고 짧게 작성하세요.",
  ].join("\n");
}

function pickDatabaseAnswer(
  questionId: string,
  styleId: string,
  length: ApologeticsLength
): { answer: string; questionId: string } | null {
  const question = allQuestions.find((q) => q.id === questionId);
  if (!question) return null;

  const selected =
    question.answers.find((a) => a.styleId === styleId) ||
    question.answers.find((a) => a.styleId === "formal") ||
    question.answers[0];

  if (!selected) return null;

  if (length === "concise") {
    return { answer: toConcise(selected.content), questionId: question.id };
  }

  const support =
    question.answers.find((a) => a.styleId === "academic")?.content ||
    question.answers.find((a) => a.styleId === "formal")?.content;

  return {
    answer: toDetailed(selected.content, support),
    questionId: question.id,
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { questionId, questionText, styleId, length } = body;
  const normalizedStyle = typeof styleId === "string" ? styleId : "formal";
  const normalizedLength = normalizeLength(length);
  const hasQuestionId = typeof questionId === "string" && questionId.trim().length > 0;
  const normalizedQuestionText =
    typeof questionText === "string" ? questionText.trim() : "";
  const hasQuestionText = normalizedQuestionText.length > 0;

  // 1) DB 라이브러리 질문 선택은 기존처럼 DB 우선
  if (hasQuestionId) {
    const fromId = pickDatabaseAnswer(questionId, normalizedStyle, normalizedLength);
    if (fromId) {
      return NextResponse.json({
        answer: fromId.answer,
        styleId: normalizedStyle,
        source: "database",
        questionId: fromId.questionId,
      });
    }
  }

  // 2) 직접질문은 AI 우선 (DB는 참고/폴백)
  const openai = getOpenAIClient();

  if (openai && hasQuestionText) {
    try {
      const systemPrompt = getApologeticsPrompt(normalizedStyle, normalizedLength);
      const relatedMatches = searchQuestionsWithScore(allQuestions, normalizedQuestionText)
        .filter((item) => item.score >= 8)
        .slice(0, 3);

      const relatedContext = relatedMatches
        .map((item, idx) => {
          const formalAnswer =
            item.question.answers.find((a) => a.styleId === "formal") ||
            item.question.answers[0];
          const concise = toConcise(formalAnswer?.content ?? "");
          return `${idx + 1}. 질문: ${item.question.question}\n   참고 답변 핵심: ${concise}`;
        })
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              `사용자 질문: ${normalizedQuestionText}`,
              "",
              buildAiGuide(normalizedLength),
              "특히 이단/천주교 관련 질문이면 핵심교리 비교를 명확히 하되, 공격적 표현 없이 설명하세요.",
              relatedContext
                ? `\n관련 DB 참고 (질문 의미가 맞을 때만 사용):\n${relatedContext}`
                : "\n관련 DB 참고: 없음",
            ].join("\n"),
          },
        ],
        temperature: 0.3,
        max_tokens: normalizedLength === "detailed" ? 900 : 420,
      });

      const answer =
        completion.choices[0]?.message?.content || "답변을 생성할 수 없습니다.";

      return NextResponse.json({
        answer,
        styleId: normalizedStyle,
        source: "ai",
        questionId,
      });
    } catch {
      // AI 실패 시 DB 폴백으로 이어집니다.
    }
  }

  // 3) AI 사용 불가/실패 시 DB 유사 매칭 폴백
  if (hasQuestionText) {
    const best = findBestQuestionMatch(allQuestions, normalizedQuestionText, 13);
    if (best) {
      const matched = pickDatabaseAnswer(
        best.question.id,
        normalizedStyle,
        normalizedLength
      );
      if (matched) {
        return NextResponse.json({
          answer: matched.answer,
          styleId: normalizedStyle,
          source: "database",
          questionId: matched.questionId,
          matchedScore: best.score,
        });
      }
    }
  }

  if (!openai) {
    return NextResponse.json({
      answer:
        "현재 AI 답변을 사용할 수 없습니다. OpenAI API 키를 확인해 주세요.",
      styleId: normalizedStyle,
      source: "fallback",
      questionId,
    });
  }

  return NextResponse.json(
    { error: "답변 생성 중 오류가 발생했습니다." },
    { status: 500 }
  );
}
