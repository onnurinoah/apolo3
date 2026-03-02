import { NextRequest, NextResponse } from "next/server";
import { allQuestions } from "@/data/questions";
import { getOpenAIClient } from "@/lib/openai";
import { STYLE_PROMPTS } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { questionId, questionText, styleId } = body;

  // Try database first
  if (questionId) {
    const question = allQuestions.find((q) => q.id === questionId);
    if (question) {
      const variant = question.answers.find((a) => a.styleId === styleId);
      if (variant) {
        return NextResponse.json({
          answer: variant.content,
          styleId,
          source: "database",
          questionId,
        });
      }
    }
  }

  // AI fallback
  const openai = getOpenAIClient();
  if (!openai) {
    // No API key - return a fallback message
    return NextResponse.json({
      answer:
        "현재 AI 답변 생성 기능을 사용할 수 없습니다. OpenAI API 키를 설정해주세요.",
      styleId,
      source: "fallback",
      questionId,
    });
  }

  try {
    const systemPrompt = STYLE_PROMPTS[styleId] || STYLE_PROMPTS.formal;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: questionText || "이 질문에 답해주세요." },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content || "답변을 생성할 수 없습니다.";

    return NextResponse.json({
      answer,
      styleId,
      source: "ai",
      questionId,
    });
  } catch {
    return NextResponse.json(
      { error: "AI 답변 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
