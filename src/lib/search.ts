import { Question, CategoryId } from "@/types/question";

export interface QuestionMatch {
  question: Question;
  score: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^0-9a-z가-힣\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

function bigrams(text: string): string[] {
  const t = normalize(text).replace(/\s+/g, "");
  if (t.length < 2) return t ? [t] : [];
  const out: string[] = [];
  for (let i = 0; i < t.length - 1; i += 1) {
    out.push(t.slice(i, i + 2));
  }
  return out;
}

function overlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  let hit = 0;
  for (const token of b) {
    if (setA.has(token)) hit += 1;
  }
  return (hit / Math.max(1, b.length)) * 10;
}

function scoreQuestion(question: Question, query: string): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const qTokens = tokenize(question.question);
  const queryTokens = tokenize(normalizedQuery);
  const questionText = normalize(question.question);

  let score = 0;

  if (questionText === normalizedQuery) {
    score += 40;
  } else if (questionText.includes(normalizedQuery)) {
    score += 22;
  }

  for (const token of queryTokens) {
    if (qTokens.includes(token)) score += 5;
    if (question.keywords.some((kw) => normalize(kw) === token)) score += 8;
    if (question.keywords.some((kw) => normalize(kw).includes(token))) score += 4;
    if (questionText.includes(token)) score += 2;
  }

  const keywordTokens = question.keywords.flatMap((kw) => tokenize(kw));
  score += overlapScore(keywordTokens, queryTokens);

  const qBigrams = bigrams(question.question);
  const queryBigrams = bigrams(query);
  score += overlapScore(qBigrams, queryBigrams) * 0.6;

  return Number(score.toFixed(2));
}

export function searchQuestionsWithScore(
  allQuestions: Question[],
  query: string,
  categoryId?: CategoryId
): QuestionMatch[] {
  let questions = allQuestions;
  if (categoryId) {
    questions = questions.filter((q) => q.categoryId === categoryId);
  }

  if (!query.trim()) {
    return questions.map((question) => ({ question, score: 0 }));
  }

  const scored = questions
    .map((question) => ({ question, score: scoreQuestion(question, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored;
}

export function searchQuestions(
  allQuestions: Question[],
  query: string,
  categoryId?: CategoryId
): Question[] {
  return searchQuestionsWithScore(allQuestions, query, categoryId).map(
    (item) => item.question
  );
}

export function findBestQuestionMatch(
  allQuestions: Question[],
  query: string,
  minScore = 13
): QuestionMatch | null {
  if (!query.trim()) return null;
  const matches = searchQuestionsWithScore(allQuestions, query);
  if (!matches.length) return null;
  const best = matches[0];
  return best.score >= minScore ? best : null;
}
