export interface Question {
  id: string;
  question: string;
  options: { label: string; value: string }[];
  correctAnswer: string;
  isBonus?: boolean;
}

export interface GameResult {
  questionNumber: number;
  question: string;
  answer: string;
  isCorrect: boolean;
  timeInSeconds: number;
}

export const sampleQuestions: Question[] = [
  {
    id: "q1",
    question: "What is the name of the fictional metal that Captain America's shield is primarily made out of?",
    options: [
      { label: "a", value: "Kryptonite" },
      { label: "b", value: "Vibranium" },
      { label: "c", value: "Diamond" },
      { label: "d", value: "Tungsten" },
    ],
    correctAnswer: "Vibranium",
  },
  {
    id: "q2",
    question: "Which country won the 2025/26 AFCON?",
    options: [
      { label: "a", value: "Côte d'Ivoire" },
      { label: "b", value: "Nigeria" },
      { label: "c", value: "Senegal" },
      { label: "d", value: "Morocco" },
    ],
    correctAnswer: "Senegal",
    isBonus: true,
  },
  {
    id: "q3",
    question: "What is the capital city of Brazil?",
    options: [
      { label: "a", value: "Rio de Janeiro" },
      { label: "b", value: "São Paulo" },
      { label: "c", value: "Brasília" },
      { label: "d", value: "Salvador" },
    ],
    correctAnswer: "Brasília",
  },
  {
    id: "q4",
    question: "Which country has the most manufacturing exports?",
    options: [
      { label: "a", value: "United States" },
      { label: "b", value: "China" },
      { label: "c", value: "Germany" },
      { label: "d", value: "Japan" },
    ],
    correctAnswer: "China",
  },
  {
    id: "q5",
    question: "What is the largest country by GDP?",
    options: [
      { label: "a", value: "China" },
      { label: "b", value: "United States" },
      { label: "c", value: "Japan" },
      { label: "d", value: "Germany" },
    ],
    correctAnswer: "United States",
  },
  {
    id: "q6",
    question: "Which of these country is a sovereign nation?",
    options: [
      { label: "a", value: "Puerto Rico" },
      { label: "b", value: "Greenland" },
      { label: "c", value: "Singapore" },
      { label: "d", value: "Hong Kong" },
    ],
    correctAnswer: "Singapore",
  },
];
