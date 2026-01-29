import { useState, useEffect, useCallback } from "react";
import { Swords } from "lucide-react";
import ChallengeIntro from "@/components/gameplay/ChallengeIntro";
import GameplayHeader from "@/components/gameplay/GameplayHeader";
import QuestionCard from "@/components/gameplay/QuestionCard";
import AnswerOption from "@/components/gameplay/AnswerOption";
import ResultsHeader from "@/components/results/ResultsHeader";
import ResultsScoreCard from "@/components/results/ResultsScoreCard";
import ResultsBreakdown from "@/components/results/ResultsBreakdown";
import ResultsActions from "@/components/results/ResultsActions";
import { sampleQuestions, type Question, type GameResult } from "@/data/quizData";

type GameState = "intro" | "playing" | "results";
type AnswerState = "default" | "selected" | "correct" | "wrong" | "opponent-wrong";

interface GameplayProps {
  player1: {
    name: string;
    avatar: string;
  };
  player2: {
    name: string;
    avatar: string;
  };
  onReturnToLobby: () => void;
}

const Gameplay = ({ player1, player2, onReturnToLobby }: GameplayProps) => {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [showResultsBreakdown, setShowResultsBreakdown] = useState(false);
  const [isOpponentTurn, setIsOpponentTurn] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [totalPlayTime, setTotalPlayTime] = useState("07min 15secs");

  const currentQuestion = sampleQuestions[currentQuestionIndex];
  const totalQuestions = sampleQuestions.length;

  // Timer effect
  useEffect(() => {
    if (gameState !== "playing" || isAnswerRevealed) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - reveal answer
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentQuestionIndex, isAnswerRevealed]);

  const handleTimeUp = useCallback(() => {
    if (!currentQuestion) return;
    
    setIsAnswerRevealed(true);
    const correctAnswer = currentQuestion.correctAnswer;
    
    // Show correct answer
    const newStates: Record<string, AnswerState> = {};
    currentQuestion.options.forEach((opt) => {
      if (opt.value === correctAnswer) {
        newStates[opt.value] = "correct";
      } else if (opt.value === selectedAnswer) {
        newStates[opt.value] = "wrong";
      }
    });
    setAnswerStates(newStates);

    // Add to results
    setGameResults((prev) => [
      ...prev,
      {
        questionNumber: currentQuestionIndex + 1,
        question: currentQuestion.question,
        answer: selectedAnswer || "No answer",
        isCorrect: selectedAnswer === correctAnswer,
        timeInSeconds: 10 - timeLeft,
      },
    ]);

    // Move to next question after delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  }, [currentQuestion, selectedAnswer, currentQuestionIndex, timeLeft]);

  const handleAnswerSelect = (value: string) => {
    if (isAnswerRevealed || selectedAnswer) return;

    setSelectedAnswer(value);
    setIsAnswerRevealed(true);

    const correctAnswer = currentQuestion.correctAnswer;
    const isCorrect = value === correctAnswer;
    const points = currentQuestion.isBonus ? 7 : 5;

    // Simulate opponent answer (random wrong answer sometimes)
    const opponentAnswered = Math.random() > 0.3;
    const opponentCorrect = opponentAnswered && Math.random() > 0.5;
    let opponentAnswer: string | null = null;
    
    if (opponentAnswered) {
      if (opponentCorrect) {
        opponentAnswer = correctAnswer;
      } else {
        const wrongOptions = currentQuestion.options.filter(
          (opt) => opt.value !== correctAnswer
        );
        opponentAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)].value;
      }
    }

    // Update answer states
    const newStates: Record<string, AnswerState> = {};
    currentQuestion.options.forEach((opt) => {
      if (opt.value === correctAnswer) {
        newStates[opt.value] = "correct";
      } else if (opt.value === value && !isCorrect) {
        newStates[opt.value] = "wrong";
      } else if (opt.value === opponentAnswer && opponentAnswer !== correctAnswer) {
        newStates[opt.value] = "opponent-wrong";
      }
    });
    setAnswerStates(newStates);

    // Update scores
    if (isCorrect) {
      setPlayer1Score((prev) => prev + points);
    }
    if (opponentCorrect) {
      setPlayer2Score((prev) => prev + points);
    }

    // Add to results
    setGameResults((prev) => [
      ...prev,
      {
        questionNumber: currentQuestionIndex + 1,
        question: currentQuestion.question,
        answer: value,
        isCorrect,
        timeInSeconds: 10 - timeLeft,
      },
    ]);

    // Move to next question after delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(10);
      setSelectedAnswer(null);
      setAnswerStates({});
      setIsAnswerRevealed(false);
      setIsOpponentTurn(Math.random() > 0.5);
    } else {
      // Game over
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setTotalPlayTime(`${mins.toString().padStart(2, "0")}min ${secs.toString().padStart(2, "0")}secs`);
      setGameState("results");
    }
  };

  const handleIntroComplete = () => {
    setGameState("playing");
    setStartTime(Date.now());
  };

  const isVictory = player1Score > player2Score;

  if (gameState === "intro") {
    return (
      <ChallengeIntro
        player1={player1}
        player2={player2}
        onComplete={handleIntroComplete}
      />
    );
  }

  if (gameState === "results") {
    return (
      <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
        {/* Green glow effect at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />

        {/* Header */}
        <header className="flex items-center justify-center gap-2 text-primary py-4 sm:py-6">
          <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm font-medium">Friendly Challenge</span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 sm:px-6 pb-6 max-w-2xl mx-auto w-full">
          <ResultsHeader isVictory={isVictory} />

          <ResultsScoreCard
            player1={{ ...player1, score: player1Score }}
            player2={{ ...player2, score: player2Score }}
            playTime={totalPlayTime}
            showResults={showResultsBreakdown}
            onToggleResults={() => setShowResultsBreakdown(!showResultsBreakdown)}
          />

          {showResultsBreakdown && <ResultsBreakdown results={gameResults} />}

          <div className="w-full">
            <ResultsActions
              onShareResults={() => {}}
              onReturnToLobby={onReturnToLobby}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
      {/* Green glow effect at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />

      <GameplayHeader
        player1={{ ...player1, score: player1Score }}
        player2={{ ...player2, score: player2Score }}
      />

      <main className="flex-1 px-4 sm:px-6 py-4 max-w-2xl mx-auto w-full">
        <QuestionCard
          questionNumber={currentQuestionIndex + 1}
          question={currentQuestion.question}
          isBonus={currentQuestion.isBonus}
          currentPlayer={player1}
          opponentPlayer={player2}
          timeLeft={timeLeft}
          isOpponentTurn={isOpponentTurn}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {currentQuestion.options.map((option) => (
            <AnswerOption
              key={option.value}
              label={option.label}
              value={option.value}
              state={answerStates[option.value] || "default"}
              points={
                answerStates[option.value] === "correct"
                  ? currentQuestion.isBonus
                    ? 7
                    : 5
                  : undefined
              }
              onClick={() => handleAnswerSelect(option.value)}
              disabled={isAnswerRevealed}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Gameplay;
