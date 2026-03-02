import { Question, CategoryId } from "@/types/question";

interface ScoredQuestion {
  question: Question;
  score: number;
}

export function searchQuestions(
  allQuestions: Question[],
  query: string,
  categoryId?: CategoryId
): Question[] {
  let questions = allQuestions;

  if (categoryId) {
    questions = questions.filter((q) => q.categoryId === categoryId);
  }

  if (!query.trim()) {
    return questions;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const scored: ScoredQuestion[] = [];

  for (const q of questions) {
    let score = 0;

    for (const token of tokens) {
      // Exact keyword match
      if (q.keywords.some((kw) => kw.toLowerCase() === token)) {
        score += 5;
      }
      // Partial keyword match
      else if (q.keywords.some((kw) => kw.toLowerCase().includes(token))) {
        score += 3;
      }
      // Substring in question text
      if (q.question.toLowerCase().includes(token)) {
        score += 2;
      }
    }

    if (score > 0) {
      scored.push({ question: q, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.question);
}
