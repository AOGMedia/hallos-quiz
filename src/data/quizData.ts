export interface GameResult {
  questionNumber: number;
  questionId?: string;
  question: string;
  answer: string;
  isCorrect: boolean;
  timeInSeconds: number;
}
