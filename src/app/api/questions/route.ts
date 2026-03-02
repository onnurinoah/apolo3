import { NextRequest, NextResponse } from "next/server";
import { allQuestions } from "@/data/questions";
import { searchQuestionsWithScore } from "@/lib/search";
import { CategoryId } from "@/types/question";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") as CategoryId | null;
  const limit = parseInt(searchParams.get("limit") || "300", 10);

  const scored = searchQuestionsWithScore(allQuestions, q, category || undefined);
  const results = scored.slice(0, limit).map((item) => item.question);

  return NextResponse.json({
    questions: results.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      question: r.question,
    })),
    total: scored.length,
  });
}
