import { NextRequest, NextResponse } from "next/server";
import { allQuestions } from "@/data/questions";
import { getOpenAIClient } from "@/lib/openai";
import { getApologeticsPrompt, ApologeticsLength } from "@/lib/prompts";
import { findBestQuestionMatch } from "@/lib/search";

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

  // 1) 명시적 questionId가 오면 DB 즉시 응답
  if (questionId) {
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

  // 2) 커스텀 질문도 DB 유사 매칭 우선
  if (typeof questionText === "string" && questionText.trim()) {
    const best = findBestQuestionMatch(allQuestions, questionText, 13);
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

  // 3) DB에서 충분한 매칭이 없을 때만 AI 보조
  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json({
      answer:
        "현재 AI 보조 답변을 사용할 수 없습니다. 질문 DB에서 비슷한 항목을 먼저 찾아보시거나 API 키를 확인해주세요.",
      styleId: normalizedStyle,
      source: "fallback",
      questionId,
    });
  }

  try {
    const systemPrompt = getApologeticsPrompt(normalizedStyle, normalizedLength);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: questionText || "이 질문에 답해주세요." },
      ],
      temperature: 0.6,
      max_tokens: normalizedLength === "detailed" ? 900 : 420,
    });

    const answer = completion.choices[0]?.message?.content || "답변을 생성할 수 없습니다.";

    return NextResponse.json({
      answer,
      styleId: normalizedStyle,
      source: "ai",
      questionId,
    });
  } catch {
    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
