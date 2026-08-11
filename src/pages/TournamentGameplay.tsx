import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Flag } from "lucide-react";
import QuestionCard from "@/components/gameplay/QuestionCard";
import AnswerOption from "@/components/gameplay/AnswerOption";
import ForfeitModal from "@/components/modals/ForfeitModal";
import { getSocket, onConnectionChange } from "@/lib/socket/socket";
import { joinTournament, submitTournamentAnswer } from "@/lib/socket/tournamentEmitters";
import {
  onTournamentAnswerRecorded, offTournamentAnswerRecorded,
  onRoundEnded, offRoundEnded,
  type RoundEndedPayload,
} from "@/lib/socket/events";
import { FORMAT_LABELS, type TournamentFormat } from "@/lib/api/tournament";
import { useForfeitTournament } from "@/hooks/useTournament";
import { useTournamentStore } from "@/store/tournamentStore";

type GameState = "playing" | "waiting_for_others" | "round_over";
type AnswerState = "default" | "selected" | "correct" | "wrong" | "opponent-wrong";

interface ActiveQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
  correctAnswer: string | null;
  timeLimit: number;
}

interface StoredRound {
  tournamentId: string;
  roundNumber: number;
  format: TournamentFormat;
  questions: Array<{ id: string; questionText: string; options: Record<string, string> }>;
}

function readStoredRound(): StoredRound | null {
  const raw = sessionStorage.getItem("currentTournamentRound");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredRound;
  } catch {
    return null;
  }
}

function getMyId(): number | null {
  try {
    const token = sessionStorage.getItem("auth_token");
    if (!token) return null;
    return Number(JSON.parse(atob(token.split(".")[1]))?.id);
  } catch {
    return null;
  }
}

const QUESTION_TIME_LIMIT = 10;

const TournamentGameplay = () => {
  const navigate = useNavigate();
  const round = readStoredRound();
  const selectTournament = useTournamentStore((s) => s.selectTournament);
  const setView = useTournamentStore((s) => s.setView);

  const [questions] = useState<ActiveQuestion[]>(() =>
    (round?.questions ?? []).map((q) => ({
      id: q.id,
      question: q.questionText,
      options: Object.entries(q.options).map(([value, label]) => ({ label, value })),
      correctAnswer: null,
      timeLimit: QUESTION_TIME_LIMIT,
    }))
  );

  const [gameState, setGameState] = useState<GameState>("playing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState<number | undefined>(undefined);
  const [socketDisconnected, setSocketDisconnected] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundEndedPayload | null>(null);
  const [showForfeit, setShowForfeit] = useState(false);

  const selectedAnswerRef = useRef<string | null>(null);
  const timeLeftRef = useRef(QUESTION_TIME_LIMIT);
  const { mutate: forfeit, isPending: isForfeiting } = useForfeitTournament();

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Bail out if we landed here without round data (e.g. a page refresh — the
  // round is still live server-side, but we've lost the in-memory question
  // set; the tournament detail/leaderboard screen is the safe place to go).
  useEffect(() => {
    if (!round) {
      navigate("/tournament", { replace: true });
    }
  }, [round, navigate]);

  useEffect(() => {
    if (!round) return;
    joinTournament(round.tournamentId);
  }, [round]);

  useEffect(() => {
    const unsub = onConnectionChange((connected) => setSocketDisconnected(!connected));
    return unsub;
  }, []);

  // ── Round-ended listener (live for the whole screen, not just "playing") ───
  useEffect(() => {
    if (!round) return;

    const handleRoundEnded = (payload: RoundEndedPayload) => {
      if (payload.tournamentId !== round.tournamentId || payload.roundNumber !== round.roundNumber) return;
      setRoundResult(payload);
      setGameState("round_over");
    };

    onRoundEnded(handleRoundEnded);
    return () => offRoundEnded();
  }, [round]);

  // ── Answer feedback ──────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "playing" || !round) return;

    const handleAnswerRecorded = (data: { questionId: string; correct?: boolean; correctAnswer?: string; pointsEarned?: number }) => {
      const isCorrect = data.correct ?? false;
      setLastPointsEarned(data.pointsEarned);
      if (isCorrect && typeof data.pointsEarned === "number") {
        setScore((s) => s + data.pointsEarned!);
      }
      const newStates: Record<string, AnswerState> = {};
      currentQuestion?.options.forEach((opt) => {
        if (opt.value === data.correctAnswer) newStates[opt.value] = "correct";
        else if (opt.value === selectedAnswerRef.current && !isCorrect) newStates[opt.value] = "wrong";
      });
      setAnswerStates(newStates);
    };

    onTournamentAnswerRecorded(handleAnswerRecorded);
    return () => offTournamentAnswerRecorded();
  }, [gameState, round, currentQuestion]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "playing" || isAnswerRevealed || !currentQuestion) return;
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
  }, [gameState, currentIndex, isAnswerRevealed]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = useCallback((answerId: string) => {
    if (!round || !currentQuestion) return;
    submitTournamentAnswer({
      tournamentId: round.tournamentId,
      roundNumber: round.roundNumber,
      questionId: currentQuestion.id,
      answerId,
      clientTimestamp: Date.now(),
    });
  }, [round, currentQuestion]);

  const handleTimeUp = useCallback(() => {
    if (!currentQuestion) return;
    setIsAnswerRevealed(true);
    submit("timeout");
    setTimeout(() => moveToNextQuestion(), 1500);
  }, [currentQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnswerSelect = (value: string) => {
    if (isAnswerRevealed || selectedAnswer) return;
    setSelectedAnswer(value);
    selectedAnswerRef.current = value;
    setIsAnswerRevealed(true);
    submit(value);
    setTimeout(() => moveToNextQuestion(), 1500);
  };

  const moveToNextQuestion = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(QUESTION_TIME_LIMIT);
      timeLeftRef.current = QUESTION_TIME_LIMIT;
      setSelectedAnswer(null);
      selectedAnswerRef.current = null;
      setAnswerStates({});
      setIsAnswerRevealed(false);
      setLastPointsEarned(undefined);
    } else {
      // Done with our questions — wait for round_ended (other participants
      // may still be answering, or the AFK sweep will force it eventually).
      setGameState("waiting_for_others");
    }
  }, [currentIndex, totalQuestions]);

  const handleReturnToTournament = () => {
    sessionStorage.removeItem("currentTournamentRound");
    if (round) selectTournament(round.tournamentId);
    setView("leaderboard");
    navigate("/tournament");
  };

  if (!round || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading round...</p>
      </div>
    );
  }

  if (gameState === "round_over") {
    const myId = getMyId();
    const myResult = myId != null ? roundResult?.results.find((r) => r.userId === myId) : undefined;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <Trophy className="w-10 h-10 text-yellow-400" />
        <h1 className="text-xl font-bold text-foreground">Round {round.roundNumber} complete!</h1>
        <p className="text-sm text-muted-foreground">Your score this round: {score}</p>
        {myResult?.rank != null && (
          <p className="text-xs text-muted-foreground">Current standing: #{myResult.rank}</p>
        )}
        <button
          onClick={handleReturnToTournament}
          className="mt-4 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold"
        >
          View Standings
        </button>
      </div>
    );
  }

  if (gameState === "waiting_for_others") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <h1 className="text-lg font-semibold text-foreground">Waiting for other players to finish…</h1>
        <p className="text-sm text-muted-foreground">Your score: {score}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />

      <header className="pt-4 sm:pt-5 pb-3 px-4 sm:px-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-center gap-2 text-primary mb-3">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-medium">{FORMAT_LABELS[round.format]} — Round {round.roundNumber}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Your score</span>
          <span className="text-xl font-bold text-primary">{score}</span>
        </div>
        <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${totalQuestions > 0 ? Math.round((currentIndex / totalQuestions) * 100) : 0}%` }}
          />
        </div>
      </header>

      {socketDisconnected && (
        <div className="mx-4 sm:mx-6 mb-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-xs text-yellow-400 max-w-2xl mx-auto w-full animate-pulse">
          <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
          Reconnecting…
        </div>
      )}

      <main className="flex-1 px-4 sm:px-6 py-4 max-w-2xl mx-auto w-full">
        <QuestionCard
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
          question={currentQuestion.question}
          timeLeft={timeLeft}
          hasAnswered={isAnswerRevealed}
          opponentAnsweredCount={currentIndex}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {currentQuestion.options.map((option) => (
            <AnswerOption
              key={option.value}
              label={option.label}
              value={option.value}
              state={answerStates[option.value] || (selectedAnswer === option.value ? "selected" : "default")}
              points={answerStates[option.value] === "correct" ? lastPointsEarned : undefined}
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
            Forfeit tournament
          </button>
        </div>
      </main>

      {showForfeit && (
        <ForfeitModal
          penaltyAmount={0}
          opponentName="the tournament"
          onConfirm={() => {
            if (isForfeiting || !round) return;
            forfeit(round.tournamentId, {
              onSettled: () => {
                sessionStorage.removeItem("currentTournamentRound");
                sessionStorage.removeItem("currentTournamentId");
                navigate("/tournament");
              },
            });
          }}
          onCancel={() => setShowForfeit(false)}
        />
      )}
    </div>
  );
};

export default TournamentGameplay;
