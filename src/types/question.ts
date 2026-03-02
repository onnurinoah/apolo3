export type CategoryId =
  | 'existence-of-god'
  | 'bible-reliability'
  | 'jesus-deity-resurrection'
  | 'problem-of-evil'
  | 'science-and-faith'
  | 'comparative-religion'
  | 'christian-ethics'
  | 'salvation-and-grace'
  | 'church-and-worship'
  | 'meaning-and-purpose'
  | 'prayer'
  | 'afterlife'
  | 'trinity'
  | 'holy-spirit'
  | 'creation-and-evolution';

export interface Category {
  id: CategoryId;
  nameKo: string;
}

export interface AnswerVariant {
  styleId: string;
  content: string;
}

export interface Question {
  id: string;
  categoryId: CategoryId;
  question: string;
  keywords: string[];
  answers: AnswerVariant[];
}
