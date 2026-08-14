import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Flag, ShieldX } from "lucide-react";
import QuestionCard from "@/components/gameplay/QuestionCard";
import AnswerOption from "@/components/gameplay/AnswerOption";
import ForfeitModal from "@/components/modals/ForfeitModal";
import TournamentRoundResults from "@/components/tournament/TournamentRoundResults";
import { onConnectionChange } from "@/lib/socket/socket";
import {
  joinTournament,
  leaveTournament,
  submitTournamentAnswer,
} from "@/lib/socket/tournamentEmitters";
import {
  onRoundEndedScoped,
  onTournamentAnswerRecordedScoped,
  onParticipantEliminated,
  onTournamentStateRestored,
  type RoundEndedPayload,
} from "@/lib/socket/events";
import { FORMAT_LABELS, type TournamentFormat } from "@/lib/api/tournament";
import { useForfeitTournament, useTournamentRound } from "@/hooks/useTournament";
import { useTournamentStore } from "@/store/tournamentStore";
import { getMyUserId } from "@/lib/auth/currentUser";

type GameState = "playing" | "waiting_for_others" | "round_over" | "eliminated";
type AnswerState = "default" | "selected" | "correct" | "wrong" | "opponent-wrong";

interface ActiveQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
  timeLimit: number;
}

interface StoredRound {
  tournamentId: string;
  roundNumber: number;
  format: TournamentFormat;
  questions: Array<{ id: string; questionText: string; options: Record<string, string> }>;
  timeLimit?: number;
}

interface StoredBye {
  tournamentId: string;
  roundNumber: number;
}

const DEFAULT_TIME_LIMIT = 10;
const REVEAL_MS = 1500;

function readStoredRound(): StoredRound | null {
  const raw = sessionStorage.getItem("currentTournamentRound");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredRound;
  } catch {
    return null;
  }
}

function readStoredBye(): StoredBye | null {
  const raw = sessionStorage.getItem("currentTournamentBye");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredBye;
  } catch {
    return null;
  }
}

function toActiveQuestion(
  q: { id: string; questionText: string; options: Record<string, string> },
  timeLimit: number
): ActiveQuestion {
  return {
    id: q.id,
    question: q.questionText,
    options: Object.entries(q.options).map(([value, label]) => ({ label, value })),
    timeLimit,
  };
}

const TournamentGameplay = () => {
  const navigate = useNavigate();
  const round = useMemo(readStoredRound, []);
  const bye = useMemo(readStoredBye, []);
  const selectTournament = useTournamentStore((s) => s.selectTournament);
  const setView = useTournamentStore((s) => s.setView);

  const timeLimit = round?.timeLimit ?? DEFAULT_TIME_LIMIT;

  // Server-side round state: the questions themselves (fuller than what we
  // stashed at round_started) plus `myEntry.answers`, which tells us how far
  // this participant already got. Without it a refresh restarted at question
  // one and every re-answer was rejected as already-answered.
  const {
    data: roundDetail,
    isLoading: isHydrating,
    refetch: refetchRound,
  } = useTournamentRound(round?.tournamentId ?? "", round?.roundNumber ?? 0, {
    enabled: !!round,
  });

  const [questions, setQuestions] = useState<ActiveQuestion[]>(() =>
    (round?.questions ?? []).map((q) => toActiveQuestion(q, timeLimit))
  );

  const [gameState, setGameState] = useState<GameState>("playing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStates, setAnswerStates] = useState<Record<string, AnswerState>>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState<number | undefined>(undefined);
  const [socketDisconnected, setSocketDisconnected] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundEndedPayload | null>(null);
  const [showForfeit, setShowForfeit] = useState(false);

  const selectedAnswerRef = useRef<string | null>(null);
  const hasHydratedRef = useRef(false);
  const { mutate: forfeit, isPending: isForfeiting } = useForfeitTournament();

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  // Landed here with neither a round nor a bye — nothing to show.
  useEffect(() => {
    if (!round && !bye) navigate("/tournament", { replace: true });
  }, [round, bye, navigate]);

  // Stay subscribed while sitting out a bye too — the next round_started is
  // what moves us on, and it's a room broadcast.
  useEffect(() => {
    const tournamentId = round?.tournamentId ?? bye?.tournamentId;
    if (tournamentId) joinTournament(tournamentId);
  }, [round, bye]);

  useEffect(() => {
    const unsub = onConnectionChange((connected) => setSocketDisconnected(!connected));
    return unsub;
  }, []);

  // ── Resume from server-recorded progress (runs once) ─────────────────────
  useEffect(() => {
    if (!round || !roundDetail || hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    const serverQuestions = roundDetail.round.questions ?? [];
    const source = serverQuestions.length > 0 ? serverQuestions : round.questions;
    const rebuilt = source.map((q) => toActiveQuestion(q, timeLimit));
    setQuestions(rebuilt);

    const myEntry = roundDetail.myEntry;
    setScore(myEntry?.score ?? 0);

    if (roundDetail.round.status === "completed") {
      setGameState("round_over");
      return;
    }

    const answered = new Set(myEntry?.answers ?? []);
    const resumeAt = rebuilt.findIndex((q) => !answered.has(q.id));

    if (resumeAt === -1) {
      setGameState("waiting_for_others");
    } else if (resumeAt > 0) {
      setCurrentIndex(resumeAt);
      setTimeLeft(timeLimit);
    }
  }, [round, roundDetail, timeLimit]);

  // ── Round ended ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!round) return;
    return onRoundEndedScoped((payload) => {
      if (payload.tournamentId !== round.tournamentId) return;
      if (payload.roundNumber !== round.roundNumber) return;
      setRoundResult(payload);
      setGameState("round_over");
    });
  }, [round]);

  // ── Eliminated ───────────────────────────────────────────────────────────
  // Delivered to the room and directly to us (possibly twice, if the direct
  // send was queued through a reconnect) — setting the same state is a no-op.
  useEffect(() => {
    if (!round) return;
    return onParticipantEliminated((payload) => {
      if (payload.tournamentId !== round.tournamentId) return;
      if (payload.userId !== getMyUserId()) return;
      setGameState("eliminated");
    });
  }, [round]);

  // ── Reconnected mid-round — re-sync progress from the server ─────────────
  useEffect(() => {
    if (!round) return;
    return onTournamentStateRestored((payload) => {
      if (payload.tournamentId !== round.tournamentId) return;
      hasHydratedRef.current = false; // let the resume effect run again
      refetchRound();
    });
  }, [round, refetchRound]);

  // ── Answer feedback ──────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "playing" || !round) return;
    return onTournamentAnswerRecordedScoped((data) => {
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
    });
  }, [gameState, round, currentQuestion]);

  const submit = useCallback(
    (answerId: string) => {
      if (!round || !currentQuestion) return;
      submitTournamentAnswer({
        tournamentId: round.tournamentId,
        roundNumber: round.roundNumber,
        questionId: currentQuestion.id,
        answerId,
        clientTimestamp: Date.now(),
      });
    },
    [round, currentQuestion]
  );

  const moveToNextQuestion = useCallback(() => {
    setCurrentIndex((i) => {
      if (i < totalQuestions - 1) {
        setTimeLeft(timeLimit);
        setSelectedAnswer(null);
        selectedAnswerRef.current = null;
        setAnswerStates({});
        setIsAnswerRevealed(false);
        setLastPointsEarned(undefined);
        return i + 1;
      }
      // Out of questions — wait for round_ended (others may still be playing,
      // or the server's stale-round sweep will force it).
      setGameState("waiting_for_others");
      return i;
    });
  }, [totalQuestions, timeLimit]);

  const handleTimeUp = useCallback(() => {
    if (!currentQuestion) return;
    setIsAnswerRevealed(true);
    submit("timeout");
    setTimeout(() => moveToNextQuestion(), REVEAL_MS);
  }, [currentQuestion, submit, moveToNextQuestion]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== "playing" || isAnswerRevealed || !currentQuestion) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, currentIndex, isAnswerRevealed, currentQuestion, handleTimeUp]);

  const handleAnswerSelect = (value: string) => {
    if (isAnswerRevealed || selectedAnswer) return;
    setSelectedAnswer(value);
    selectedAnswerRef.current = value;
    setIsAnswerRevealed(true);
    submit(value);
    setTimeout(() => moveToNextQuestion(), REVEAL_MS);
  };

  /**
   * Back to the tournament screen. The room subscription deliberately survives
   * this — we're still in the tournament between rounds, and leaving the room
   * would mean missing the next `round_started`. TournamentWatcher drops the
   * room when we're actually out (eliminated, or the tournament ends).
   */
  const handleReturnToTournament = () => {
    sessionStorage.removeItem("currentTournamentRound");
    if (round) selectTournament(round.tournamentId);
    setView("leaderboard");
    navigate("/tournament");
  };

  /** Out for good — drop the room so a later round can't pull us back in. */
  const exitTournamentForGood = useCallback(() => {
    if (round) leaveTournament(round.tournamentId);
    sessionStorage.removeItem("currentTournamentRound");
    sessionStorage.removeItem("currentTournamentId");
  }, [round]);

  // ── Bye: no round to play, still in the tournament ───────────────────────
  if (!round && bye) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center text-3xl">
          🎟️
        </div>
        <h1 className="text-xl font-bold text-foreground">You drew a bye</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          There was an odd number of players in round {bye.roundNumber}, so you sit this one out
          and advance straight to round {bye.roundNumber + 1}.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Waiting for the next round to start…
        </div>
        <button
          onClick={() => {
            selectTournament(bye.tournamentId);
            setView("leaderboard");
            navigate("/tournament");
          }}
          className="mt-4 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold"
        >
          View Standings
        </button>
      </div>
    );
  }

  if (!round) return null;

  if (isHydrating && !hasHydratedRef.current) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Restoring your round…</p>
      </div>
    );
  }

  if (gameState === "eliminated") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldX className="w-10 h-10 text-destructive" />
        <h1 className="text-xl font-bold text-foreground">You've been eliminated</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          You didn't make the cut in round {round.roundNumber}. Your final standing is on the
          tournament leaderboard.
        </p>
        <p className="text-sm text-muted-foreground">Your score this round: {score}</p>
        <button
          onClick={() => {
            exitTournamentForGood();
            if (round) selectTournament(round.tournamentId);
            setView("leaderboard");
            navigate("/tournament");
          }}
          className="mt-4 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold"
        >
          View Final Standings
        </button>
      </div>
    );
  }

  if (gameState === "round_over") {
    const myId = getMyUserId();
    const results = roundResult?.results ?? [];
    const myResult = myId != null ? results.find((r) => r.userId === myId) : undefined;
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4 py-8 overflow-y-auto">
        <Trophy className="w-10 h-10 text-yellow-400" />
        <h1 className="text-xl font-bold text-foreground">Round {round.roundNumber} complete!</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            Your score: <span className="text-primary font-semibold">{score}</span>
          </span>
          {myResult?.rank != null && (
            <span className="text-muted-foreground">
              Placed <span className="text-accent font-semibold">#{myResult.rank}</span>
            </span>
          )}
        </div>

        {results.length > 0 && (
          <TournamentRoundResults
            tournamentId={round.tournamentId}
            results={results}
            myUserId={myId}
          />
        )}

        <button
          onClick={handleReturnToTournament}
          className="mt-2 px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-semibold"
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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading round…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />

      <header className="pt-4 sm:pt-5 pb-3 px-4 sm:px-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-center gap-2 text-primary mb-3">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-medium">
            {FORMAT_LABELS[round.format]} — Round {round.roundNumber}
          </span>
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
        <div className="px-3 py-2 mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-xs text-yellow-400 max-w-2xl mx-auto w-full animate-pulse">
          <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
          Reconnecting… your answers are saved and will be sent.
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
            if (isForfeiting) return;
            forfeit(round.tournamentId, {
              onSettled: () => {
                exitTournamentForGood();
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
