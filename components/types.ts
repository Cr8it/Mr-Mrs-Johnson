export interface Response {
  questionId: string;
  answer: string;
}

export interface Option {
  id: string;
  name: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  isAttending: boolean | null;
  mealChoice: Option | null;
  dessertChoice: Option | null;
  dietaryNotes: string | null;
  responses: Response[];
}

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options: string;
  isRequired: boolean;
  perGuest: boolean;
  isActive: boolean;
  order: number;
}

export enum QuestionType {
  TEXT = "TEXT",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  BOOLEAN = "BOOLEAN",
  DATE = "DATE"
}

export interface Household {
  id: string;
  name: string;
  code: string;
  guests: Guest[];
  questions?: Question[];
}