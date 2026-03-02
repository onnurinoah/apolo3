import { NextRequest, NextResponse } from "next/server";
import { allQuestions } from "@/data/questions";
import { searchQuestions } from "@/lib/search";
import { CategoryId } from "@/types/question";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") as CategoryId | null;
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  const results = searchQuestions(
    allQuestions,
    q,
    category || undefined
  ).slice(0, limit);

  return NextResponse.json({
    questions: results.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      question: r.question,
    })),
    total: results.length,
  });
}
