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
import ShareResultModal from "@/components/results/ShareResultModal";
import ForfeitModal from "@/components/modals/ForfeitModal";
import { avatars } from "@/data/gameData";
import { useForfeitMatch } from "@/hooks/useChallenge";
import { joinMatch, submitAnswer } from "@/lib/socket/emitters";
import { attachMatchEvents, detachMatchEvents } from "@/lib/socket/events";
import { getSocket, onConnectionChange } from "@/lib/socket/socket";
import { getMatch } from "@/lib/api/lobby";
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
    timeLimit: Math.round(timeLimit),
  };
}

const LoadingFallback = ({ onBackToLobby }: { onBackToLobby: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onBackToLobby();
    }, 10000); // 10 seconds timeout
    return () => clearTimeout(timer);
  }, [onBackToLobby]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading match...</p>
      <p className="text-xs text-muted-foreground/60 italic px-8 text-center">
        Taking a while? We'll return you to the lobby if the match doesn't start in 10s.
      </p>
      <button
        onClick={onBackToLobby}
        className="text-xs text-muted-foreground underline mt-2"
      >
        Back to lobby
      </button>
    </div>
  );
};

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Join match room immediately on mount so we don't miss early socket events
  useEffect(() => {
    if (matchId) joinMatch(matchId);
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for opponent_progress from mount (not just when playing)
  // so we don't miss events during the intro animation
  useEffect(() => {
    if (!matchId) return;
    const socket = getSocket();
    const handler = (data: { score?: number; answersCount?: number; answeredCorrectly?: boolean }) => {
      if (typeof data.score === "number") {
        setPlayer2Score(data.score);
      }
      if (typeof data.answersCount === "number") {
        setOpponentAnsweredCount(data.answersCount);
      }
    };
    socket.on("opponent_progress", handler);
    return () => { socket.off("opponent_progress", handler); };
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps
  const finalScores = match?.finalScores as { p1: number; p2: number; winnerId: string | number } | undefined;
  useEffect(() => {
    if (!matchRaw) { navigate("/lobby", { replace: true }); return; }
    if (sessionStorage.getItem("matchEnded") === "true") {
      if (finalScores) {
        // Restore results state from stored scores
        setPlayer1Score(finalScores.p1);
        setPlayer2Score(finalScores.p2);
        setWinnerId(finalScores.winnerId != null ? Number(finalScores.winnerId) : null);
        setGameState("results");
      } else {
        sessionStorage.removeItem("matchEnded");
        navigate("/lobby", { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [opponentAnsweredCount, setOpponentAnsweredCount] = useState(0);
  const [socketDisconnected, setSocketDisconnected] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [totalPlayTime, setTotalPlayTime] = useState("00min 00secs");
  const [showForfeit, setShowForfeit] = useState(false);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const { mutate: forfeit } = useForfeitMatch();

  const selectedAnswerRef = useRef<string | null>(null);
  const timeLeftRef = useRef(10);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // ── Connection state listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsub = onConnectionChange((connected) => {
      setSocketDisconnected(!connected);
    });
    return unsub;
  }, []);

  // ── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameState !== "playing" || !matchId) return;

    const socket = getSocket();

    const handleDisconnect = (reason: string) => {
      if (reason === "io server disconnect") {
        // Server intentionally ended the connection — match is over.
        // Transition to results with whatever scores we have accumulated.
        setSocketDisconnected(true);
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
      }
    };

    socket.on("disconnect", handleDisconnect);

    attachMatchEvents({
      onMatchStarted: (data) => {
        setTimeLeft(Math.round(data.timeLimit ?? 10));
        timeLeftRef.current = Math.round(data.timeLimit ?? 10);
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
        // Track points earned for display on the AnswerOption
        if (typeof data.pointsEarned === "number") {
          setAnswerStates(prev => ({ ...prev, _points: data.pointsEarned as unknown as AnswerState }));
        }

        if (isCorrect && typeof data.pointsEarned === "number") {
          setPlayer1Score((s) => s + data.pointsEarned!);
        }
      },
      onOpponentProgress: (_data) => {
        // Handled by the persistent early listener (mounted on component mount)
      },
      onMatchEnded: (data) => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        setTotalPlayTime(`${mins.toString().padStart(2, "0")}min ${secs.toString().padStart(2, "0")}secs`);

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

        // player1Score = challenger's points, player2Score = opponent's points
        if (iAmChallenger) {
          setPlayer1Score(data.player1Score ?? 0);
          setPlayer2Score(data.player2Score ?? 0);
        } else {
          setPlayer1Score(data.player2Score ?? 0);
          setPlayer2Score(data.player1Score ?? 0);
        }

        setWinnerId(data.winnerId != null ? Number(data.winnerId) : null);
        sessionStorage.setItem("matchEnded", "true");
        // Store final scores so refresh shows results, not a restart
        const stored = sessionStorage.getItem("currentMatch");
        if (stored) {
          try {
            const m = JSON.parse(stored);
            sessionStorage.setItem("currentMatch", JSON.stringify({ ...m, finalScores: { p1: iAmChallenger ? (data.player1Score ?? 0) : (data.player2Score ?? 0), p2: iAmChallenger ? (data.player2Score ?? 0) : (data.player1Score ?? 0), winnerId: data.winnerId } }));
          } catch { /* ignore */ }
        }
        setGameState("results");
      },
      onError: (err) => {
        console.error("[Gameplay] socket error:", err.message);
      },
    });

    return () => {
      socket.off("disconnect", handleDisconnect);
      detachMatchEvents();
    };
  }, [gameState, matchId, totalQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync absolute source of truth upon hitting results ─────────
  useEffect(() => {
    if (gameState !== "results" || !matchId) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 8;

    const tryFetch = () => {
      attempts++;
      getMatch(matchId).then((res) => {
        if (res.success && res.match) {
          const m = res.match;

          const currentUserId = (() => {
            try {
              const token = sessionStorage.getItem("auth_token");
              if (!token) return null;
              return Number(JSON.parse(atob(token.split(".")[1]))?.id);
            } catch { return null; }
          })();

          if (currentUserId && m.participants) {
            const me = m.participants.find((p: { userId: number }) => p.userId === currentUserId);
            const opp = m.participants.find((p: { userId: number }) => p.userId !== currentUserId);
            if (me) setPlayer1Score(me.score || 0);
            if (opp) setPlayer2Score(opp.score || 0);
          }

          if (m.winnerId != null) {
            setWinnerId(Number(m.winnerId));
            return; // done
          }
        }
        // winnerId still null — retry if attempts remain
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(tryFetch, 1500);
        } else {
          // Backend never set winnerId — derive winner from scores we have
          // Use -1 as sentinel to mean "resolved by score comparison, not server"
          setWinnerId(-1);
        }
      }).catch(() => {
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(tryFetch, 1500);
        } else {
          setWinnerId(-1);
        }
      });
    };

    tryFetch();
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

    // Explicitly tell the backend we timed out so it records 10 out of 10 answers completed
    if (matchId) {
      submitAnswer({
        matchId,
        questionId: currentQuestion.id,
        answer: "timeout",
        timeInSeconds: currentQuestion.timeLimit,
      });
    }

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
        timeInSeconds: Math.floor(currentQuestion.timeLimit - timeLeftRef.current),
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
    } else {
      // All questions done — wait up to 5s for match_ended from server
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

  // winnerId === null: still waiting for server result
  // winnerId === -1: server never resolved, fall back to score comparison
  // winnerId === 0: draw/forfeit with no clear winner
  const isVictory: boolean | null = winnerId === null
    ? null
    : winnerId === -1 || winnerId === 0
    ? player1Score > player2Score
    : currentUserId !== null
    ? winnerId === currentUserId
    : null;

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
              onShareResults={() => setIsShareModalOpen(true)}
              onReturnToLobby={() => {
                sessionStorage.removeItem("currentMatch");
                sessionStorage.removeItem("matchEnded");
                navigate("/lobby");
              }}
            />
          </div>
          <ShareResultModal 
            isOpen={isShareModalOpen} 
            onOpenChange={setIsShareModalOpen} 
            playerScore={player1Score} 
            isVictory={isVictory} 
          />
        </main>
      </div>
    );
  }

  // No questions yet — show loading with 10s auto-redirect
  if (!currentQuestion) {
    return (
      <LoadingFallback onBackToLobby={() => {
        sessionStorage.removeItem("currentMatch");
        sessionStorage.removeItem("matchEnded");
        navigate("/lobby", { replace: true });
      }} />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />
      <GameplayHeader
        player1={{ ...player1, score: player1Score }}
        player2={{ ...player2, score: player2Score }}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
      />

      {/* Disconnect banner — non-blocking, player can still tap answers (they'll be queued) */}
      {socketDisconnected && (
        <div className="mx-4 sm:mx-6 mb-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-xs text-yellow-400 max-w-2xl mx-auto w-full animate-pulse">
          <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
          Reconnecting... Your answers are still being saved.
        </div>
      )}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-2xl mx-auto w-full">
        <QuestionCard
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          question={currentQuestion.question}
          isBonus={currentQuestion.isBonus}
          timeLeft={timeLeft}
          hasAnswered={isAnswerRevealed}
          opponentAnsweredCount={opponentAnsweredCount}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {currentQuestion.options.map((option) => (
            <AnswerOption
              key={option.value}
              label={option.label}
              value={option.value}
              state={answerStates[option.value] || "default"}
              points={answerStates[option.value] === "correct" ? (answerStates._points as unknown as number) : undefined}
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
