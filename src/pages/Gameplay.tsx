import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Swords, Flag } from "lucide-react";
import ChallengeIntro from "@/components/gameplay/ChallengeIntro";
import GameplayHeader from "@/components/gameplay/GameplayHeader";
import QuestionCard from "@/components/gameplay/QuestionCard";
import AnswerOption from "@/components/gameplay/AnswerOption";
import ResultsHeader from "@/components/results/ResultsHeader";
import ResultsScoreCard from "@/components/results/ResultsScoreCard";
import ResultsBreakdown from "@/components/results/ResultsBreakdown";
import ResultsActions from "@/components/results/ResultsActions";
import ForfeitModal from "@/components/modals/ForfeitModal";
import { avatars } from "@/data/gameData";
import { useForfeitMatch } from "@/hooks/useChallenge";
import { joinMatch, submitAnswer } from "@/lib/socket/emitters";
import { attachMatchEvents, detachMatchEvents } from "@/lib/socket/events";
import type { MatchQuestion } from "@/lib/api/lobby";
import type { GameResult } from "@/data/quizData";

type GameState = "intro" | "playing" | "results";
type AnswerState = "default" | "correct" | "wrong" | "opponent-wrong";

// Convert API question format to internal format
interface ActiveQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
  correctAnswer: string | null; // null until server reveals it
  isBonus?: boolean;
  timeLimit: number;
}

function buildQuestion(q: MatchQuestion, timeLimit = 10): ActiveQuestion {
  return {
    id: q.id,
    question: q.questionText,
    options: Object.entries(q.options).map(([value, label]) => ({ label, value })),
    correctAnswer: null,
    timeLimit,
  };
}

const Gameplay = () => {
  const navigate = useNavigate();

  // Read match data from sessionStorage
  const matchRaw = sessionStorage.getItem("currentMatch");
  const match = matchRaw ? JSON.parse(matchRaw) : null;

  const player1 = match?.player1 ?? { name: "You", avatar: avatars[0] };
  const player2 = match?.player2 ?? { name: "Opponent", avatar: avatars[1] };
  const matchId = match?.matchId as string | undefined;

  // Build questions from real match data, fall back to empty
  const rawQuestions: MatchQuestion[] = match?.questions ?? [];
  const [questions, setQuestions] = useState<ActiveQuestion[]>(
    rawQuestions.map((q) => buildQuestion(q))
  );

  useEffect(() => {
    // Redirect if no match data or match already ended
    if (!matchRaw || sessionStorage.getItem("matchEnded") === "true") {
      sessionStorage.removeItem("matchEnded");
      navigate("/lobby", { replace: true });
    }
  }, [matchRaw, navigate]);

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
  const [totalPlayTime, setTotalPlayTime] = useState("00min 00secs");
  const [showForfeit, setShowForfeit] = useState(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const { mutate: forfeit } = useForfeitMatch();

  const selectedAnswerRef = useRef<string | null>(null);
  const timeLeftRef = useRef(10);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // ── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== "playing" || !matchId) return;

    // Join the match room immediately
    joinMatch(matchId);

    attachMatchEvents({
      onMatchStarted: (data) => {
        setTimeLeft(data.timeLimit ?? 10);
        timeLeftRef.current = data.timeLimit ?? 10;
      },
      onAnswerRecorded: (data) => {
        const isCorrect = data.correct ?? data.isCorrect ?? false;

        // Update the gameResults entry for this question with the real isCorrect value
        setGameResults((prev) =>
          prev.map((r) =>
            r.questionId === data.questionId
              ? { ...r, isCorrect }
              : r
          )
        );

        setQuestions((prev) =>
          prev.map((q, i) =>
            i === currentQuestionIndex
              ? { ...q, correctAnswer: data.correctAnswer }
              : q
          )
        );
        const newStates: Record<string, AnswerState> = {};
        currentQuestion?.options.forEach((opt) => {
          if (opt.value === data.correctAnswer) newStates[opt.value] = "correct";
          else if (opt.value === selectedAnswerRef.current && !isCorrect) newStates[opt.value] = "wrong";
        });
        setAnswerStates(newStates);
        if (isCorrect) setPlayer1Score((s) => s + (data.pointsEarned || 5));
      },
      onOpponentProgress: (data) => {
        // Use real score from backend if available, otherwise increment by 5
        if (data.score !== undefined) {
          setPlayer2Score(data.score);
        } else if (data.answeredCorrectly) {
          setPlayer2Score((s) => s + 5);
        }
        setIsOpponentTurn(false);
      },
      onMatchEnded: (data) => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        setTotalPlayTime(`${mins.toString().padStart(2, "0")}min ${secs.toString().padStart(2, "0")}secs`);
        
        // Backend sends player1Score = challenger's score, player2Score = opponent's score
        const challengerId = match?.challengerId as number | undefined;
        const myId = (() => {
          try {
            const token = sessionStorage.getItem("auth_token");
            if (!token) return null;
            return Number(JSON.parse(atob(token.split(".")[1]))?.id);
          } catch { return null; }
        })();
        
        const iAmChallenger = myId !== null && challengerId !== undefined
          ? myId === Number(challengerId)
          : true;
        
        if (iAmChallenger) {
          setPlayer1Score(data.player1Score ?? 0);
          setPlayer2Score(data.player2Score ?? 0);
        } else {
          setPlayer1Score(data.player2Score ?? 0);
          setPlayer2Score(data.player1Score ?? 0);
        }
        
        setWinnerId(data.winnerId != null ? Number(data.winnerId) : null);
        sessionStorage.setItem("matchEnded", "true");
        setGameState("results");
      },
      onError: (err) => {
        console.error("[Gameplay] socket error:", err.message);
      },
    });

    return () => detachMatchEvents();
  }, [gameState, matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== "playing" || isAnswerRevealed) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        timeLeftRef.current = prev - 1;
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, currentQuestionIndex, isAnswerRevealed]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeUp = useCallback(() => {
    if (!currentQuestion) return;
    setIsAnswerRevealed(true);
    // If we have a correct answer from server, show it; otherwise just reveal
    const correctAnswer = currentQuestion.correctAnswer;
    if (correctAnswer) {
      const newStates: Record<string, AnswerState> = {};
      currentQuestion.options.forEach((opt) => {
        if (opt.value === correctAnswer) newStates[opt.value] = "correct";
        else if (opt.value === selectedAnswerRef.current) newStates[opt.value] = "wrong";
      });
      setAnswerStates(newStates);
    }
    setGameResults((prev) => [
      ...prev,
      {
        questionNumber: currentQuestionIndex + 1,
        question: currentQuestion.question,
        answer: selectedAnswerRef.current || "No answer",
        isCorrect: false,
        timeInSeconds: currentQuestion.timeLimit,
      },
    ]);
    setTimeout(() => moveToNextQuestion(), 2000);
  }, [currentQuestion, currentQuestionIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswerSelect = (value: string) => {
    if (isAnswerRevealed || selectedAnswer) return;
    setSelectedAnswer(value);
    selectedAnswerRef.current = value;
    setIsAnswerRevealed(true);

    // Emit to server
    if (matchId && currentQuestion) {
      submitAnswer({
        matchId,
        questionId: currentQuestion.id,
        answer: value,
        timeInSeconds: currentQuestion.timeLimit - timeLeftRef.current,
      });
    }

    // Optimistic UI — server will confirm via answer_recorded
    setGameResults((prev) => [
      ...prev,
      {
        questionNumber: currentQuestionIndex + 1,
        questionId: currentQuestion?.id,
        question: currentQuestion?.question ?? "",
        answer: value,
        isCorrect: false, // updated when server responds via answer_recorded
        timeInSeconds: currentQuestion?.timeLimit - timeLeftRef.current,
      },
    ]);

    setTimeout(() => moveToNextQuestion(), 2000);
  };

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(questions[currentQuestionIndex + 1]?.timeLimit ?? 10);
      timeLeftRef.current = questions[currentQuestionIndex + 1]?.timeLimit ?? 10;
      setSelectedAnswer(null);
      selectedAnswerRef.current = null;
      setAnswerStates({});
      setIsAnswerRevealed(false);
      setIsOpponentTurn(Math.random() > 0.5);
    } else {
      // Last question answered — wait for match_ended from server (up to 5s)
      setTimeout(() => {
        setGameState((prev) => {
          if (prev !== "results") {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            setTotalPlayTime(`${mins.toString().padStart(2, "0")}min ${secs.toString().padStart(2, "0")}secs`);
            sessionStorage.setItem("matchEnded", "true");
            return "results";
          }
          return prev;
        });
      }, 5000);
    }
  }, [currentQuestionIndex, totalQuestions, questions, startTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIntroComplete = () => {
    setGameState("playing");
    setStartTime(Date.now());
  };

  // Determine if current user won using winnerId from server
  const currentUserId = (() => {
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Number(payload?.id ?? null);
    } catch { return null; }
  })();

  // winnerId === 0 means draw/no winner (e.g. forfeit with no clear winner)
  const isVictory = winnerId != null && winnerId !== 0 && currentUserId !== null
    ? winnerId === currentUserId
    : player1Score > player2Score;

  if (gameState === "intro") {
    return <ChallengeIntro player1={player1} player2={player2} onComplete={handleIntroComplete} />;
  }

  if (gameState === "results") {
    return (
      <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />
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
              onReturnToLobby={() => {
                sessionStorage.removeItem("currentMatch");
                sessionStorage.removeItem("matchEnded");
                navigate("/lobby");
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  // No questions yet — show loading with timeout fallback
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading match...</p>
        <button
          onClick={() => { sessionStorage.removeItem("currentMatch"); navigate("/lobby"); }}
          className="text-xs text-muted-foreground underline mt-2"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
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
              points={answerStates[option.value] === "correct" ? (currentQuestion.isBonus ? 7 : 5) : undefined}
              onClick={() => handleAnswerSelect(option.value)}
              disabled={isAnswerRevealed}
            />
          ))}
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowForfeit(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            Forfeit match
          </button>
        </div>
      </main>

      {showForfeit && (
        <ForfeitModal
          penaltyAmount={0}
          opponentName={player2.name}
          onConfirm={() => {
            if (matchId) {
              forfeit(matchId, {
                onSuccess: () => { sessionStorage.removeItem("currentMatch"); navigate("/lobby"); },
                onError: () => { sessionStorage.removeItem("currentMatch"); navigate("/lobby"); },
              });
            } else {
              sessionStorage.removeItem("currentMatch");
              navigate("/lobby");
            }
          }}
          onCancel={() => setShowForfeit(false)}
        />
      )}
    </div>
  );
};

export default Gameplay;
