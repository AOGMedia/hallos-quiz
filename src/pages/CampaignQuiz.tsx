import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getToken } from "@/store/authStore";
import {
  getCampaignQuizStatus,
  startCampaignQuiz,
  submitCampaignAnswer,
  submitCampaignQuiz,
  type CampaignQuestion,
} from "@/lib/api/campaignQuiz";
import CampaignLoadingScreen from "@/components/campaign/CampaignLoadingScreen";
import CampaignNotLoggedIn from "@/components/campaign/CampaignNotLoggedIn";
import CampaignInvalidLink from "@/components/campaign/CampaignInvalidLink";
import CampaignExpiredLink from "@/components/campaign/CampaignExpiredLink";
import CampaignClaimedLink from "@/components/campaign/CampaignClaimedLink";
import CampaignAlreadyCompleted from "@/components/campaign/CampaignAlreadyCompleted";
import CampaignErrorScreen from "@/components/campaign/CampaignErrorScreen";
import CampaignPendingScreen from "@/components/campaign/CampaignPendingScreen";
import CampaignResultsScreen from "@/components/campaign/CampaignResultsScreen";
import CampaignQuizHeader from "@/components/campaign/CampaignQuizHeader";
import CampaignQuizQuestion from "@/components/campaign/CampaignQuizQuestion";

type Phase =
  | "loading"
  | "no-token"
  | "not-logged-in"
  | "resuming"
  | "pending"
  | "starting"
  | "active"
  | "submitting"
  | "completed"
  | "expired"
  | "invalid"
  | "claimed"
  | "already-completed"
  | "error";

const ADVANCE_DELAY_MS = 800;

const CampaignQuiz = () => {
  const [searchParams] = useSearchParams();

  const urlToken = searchParams.get("token");
  const campaignToken = urlToken || sessionStorage.getItem("campaign_token") || "";

  useEffect(() => {
    if (urlToken) sessionStorage.setItem("campaign_token", urlToken);
  }, [urlToken]);

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingExpiresAt, setPendingExpiresAt] = useState("");

  const [questions, setQuestions] = useState<CampaignQuestion[]>([]);
  const [secondsPerQ, setSecondsPerQ] = useState(15);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [qTimeLeft, setQTimeLeft] = useState(15);
  const [totalTimeLeft, setTotalTimeLeft] = useState(300);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [result, setResult] = useState<{
    score: number;
    totalCorrect: number;
    totalQuestions: number;
    totalTimeMs: number;
  } | null>(null);

  const answeredRef = useRef(false);
  const submittingRef = useRef(false);

  // ── Submit quiz ───────────────────────────────────────────────────────────
  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPhase("submitting");
    try {
      const res = await submitCampaignQuiz(campaignToken);
      setResult({
        score: res.score,
        totalCorrect: res.totalCorrect,
        totalQuestions: res.totalQuestions,
        totalTimeMs: res.totalTimeMs,
      });
    } catch {
      // Show completed screen even if submit call fails
    }
    setPhase("completed");
  }, [campaignToken]);

  // ── Advance to next question or submit ────────────────────────────────────
  const advanceQuestion = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= questions.length) {
        doSubmit();
        return prev;
      }
      return next;
    });
    setQTimeLeft(secondsPerQ);
    setSelectedAnswer(null);
    setHasAnswered(false);
    answeredRef.current = false;
  }, [questions.length, secondsPerQ, doSubmit]);

  // ── Per-question timeout ──────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setHasAnswered(true);

    const q = questions[currentIndex];
    if (q) {
      submitCampaignAnswer(campaignToken, {
        questionId: q.questionId,
        questionIndex: q.questionIndex,
        selectedAnswer: "timeout",
        clientTimestamp: Date.now(),
      }).catch(() => {});
    }

    setTimeout(advanceQuestion, ADVANCE_DELAY_MS);
  }, [questions, currentIndex, campaignToken, advanceQuestion]);

  // ── Answer selection ──────────────────────────────────────────────────────
  const handleAnswerSelect = useCallback(
    (value: string) => {
      if (answeredRef.current || phase !== "active") return;
      answeredRef.current = true;
      setSelectedAnswer(value);
      setHasAnswered(true);

      const q = questions[currentIndex];
      if (q) {
        submitCampaignAnswer(campaignToken, {
          questionId: q.questionId,
          questionIndex: q.questionIndex,
          selectedAnswer: value,
          clientTimestamp: Date.now(),
        }).catch(() => {});
      }

      setTimeout(advanceQuestion, ADVANCE_DELAY_MS);
    },
    [phase, questions, currentIndex, campaignToken, advanceQuestion]
  );

  // ── Per-question countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active" || hasAnswered) return;
    const timer = setInterval(() => {
      setQTimeLeft((prev) => {
        if (prev <= 1) { handleTimeout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, currentIndex, hasAnswered]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Overall countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active") return;
    const timer = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) { doSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load questions and enter active state ─────────────────────────────────
  const beginQuiz = useCallback(
    async (resumeFromIndex: number, startedAtStr?: string, perQSeconds = 15) => {
      const startRes = await startCampaignQuiz(campaignToken);
      const startedAtMs = new Date(startRes.startedAt).getTime();

      let qRemaining = startRes.secondsPerQuestion;
      let totalRemaining = startRes.maxDurationSeconds;

      if (resumeFromIndex > 0) {
        const elapsedSecs = (Date.now() - startedAtMs) / 1000;
        totalRemaining = Math.max(0, startRes.maxDurationSeconds - elapsedSecs);
        const elapsedOnCurrent = elapsedSecs - resumeFromIndex * (startedAtStr ? perQSeconds : startRes.secondsPerQuestion);
        qRemaining = Math.max(0, startRes.secondsPerQuestion - elapsedOnCurrent);
      }

      setQuestions(startRes.questions);
      setSecondsPerQ(startRes.secondsPerQuestion);
      setCurrentIndex(resumeFromIndex);
      setQTimeLeft(Math.floor(qRemaining));
      setTotalTimeLeft(Math.floor(totalRemaining));
      setSelectedAnswer(null);
      setHasAnswered(false);
      answeredRef.current = false;
      setPhase("active");
    },
    [campaignToken]
  );

  // ── Start handler ─────────────────────────────────────────────────────────
  const handleStart = async () => {
    setPhase("starting");
    try {
      await beginQuiz(0);
    } catch (err: unknown) {
      const msg = (err as Error).message ?? "";
      if (msg.toLowerCase().includes("already completed")) {
        setPhase("already-completed");
      } else if (msg.toLowerCase().includes("claimed") || msg.toLowerCase().includes("another account")) {
        setPhase("claimed");
      } else {
        setErrorMsg(msg || "Failed to start quiz.");
        setPhase("error");
      }
    }
  };

  // ── Mount: auth check + status fetch ─────────────────────────────────────
  useEffect(() => {
    console.log("[CampaignQuiz] token from URL:", searchParams.get("token"));
    console.log("[CampaignQuiz] campaignToken:", campaignToken);
    console.log("[CampaignQuiz] auth token present:", !!getToken());

    if (!campaignToken) { setPhase("no-token"); return; }
    if (!getToken()) {
      // Redirect to signin per campaign.md spec
      const redirectUrl = encodeURIComponent(`https://www.hallos.quiz/campaign/quiz?token=${campaignToken}`);
      window.location.href = `https://www.hallos.net/signin?redirect=${redirectUrl}`;
      return;
    }

    getCampaignQuizStatus(campaignToken)
      .then(async (res) => {
        console.log("[CampaignQuiz] status response:", res);
        switch (res.status) {
          case "pending":
            setPendingExpiresAt(res.tokenExpiresAt ?? "");
            setPhase("pending");
            break;
          case "active":
            setPhase("resuming");
            try {
              await beginQuiz(res.answersSubmitted ?? 0, res.startedAt, res.secondsPerQuestion ?? 15);
            } catch (err: unknown) {
              setErrorMsg((err as Error).message);
              setPhase("error");
            }
            break;
          case "completed":
            setResult({
              score: res.score ?? 0,
              totalCorrect: res.totalCorrect ?? 0,
              totalQuestions: res.totalQuestions ?? 20,
              totalTimeMs: res.totalTimeMs ?? 0,
            });
            setPhase("completed");
            break;
        }
      })
      .catch((err: unknown) => {
        const msg = (err as Error).message ?? "";
        console.log("[CampaignQuiz] error fetching status:", msg);
        if (msg.toLowerCase().includes("expired")) { setPhase("expired"); return; }
        if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("already been used")) {
          setPhase("invalid");
          return;
        }
        setErrorMsg(msg || "Could not load quiz.");
        setPhase("error");
      });
  }, [campaignToken, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === "loading" || phase === "resuming") {
    return <CampaignLoadingScreen message={phase === "resuming" ? "You have a quiz in progress. Resuming…" : undefined} />;
  }
  if (phase === "not-logged-in")    return <CampaignNotLoggedIn />;
  if (phase === "no-token" || phase === "invalid") return <CampaignInvalidLink />;
  if (phase === "expired")          return <CampaignExpiredLink />;
  if (phase === "claimed")          return <CampaignClaimedLink />;
  if (phase === "already-completed") return <CampaignAlreadyCompleted />;
  if (phase === "error")            return <CampaignErrorScreen message={errorMsg} />;
  if (phase === "submitting")       return <CampaignLoadingScreen message="Submitting your quiz…" />;
  if (phase === "completed")        return <CampaignResultsScreen result={result ?? { score: 0, totalCorrect: 0, totalQuestions: 20, totalTimeMs: 0 }} />;
  if (phase === "pending" || phase === "starting") {
    return (
      <CampaignPendingScreen
        expiresAt={pendingExpiresAt}
        starting={phase === "starting"}
        onStart={handleStart}
      />
    );
  }

  // Active quiz
  const currentQuestion = questions[currentIndex];
  const options = currentQuestion
    ? Object.entries(currentQuestion.shuffledOptions).map(([k, v]) => ({ value: k, label: v as string }))
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-gradient-radial from-primary/30 to-transparent blur-3xl pointer-events-none" />
      <CampaignQuizHeader
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        totalTimeLeft={totalTimeLeft}
        hasAnswered={hasAnswered}
      />
      <main className="flex-1 px-4 pb-6 max-w-2xl mx-auto w-full">
        {currentQuestion && (
          <CampaignQuizQuestion
            question={currentQuestion}
            options={options}
            selectedAnswer={selectedAnswer}
            hasAnswered={hasAnswered}
            qTimeLeft={qTimeLeft}
            onAnswerSelect={handleAnswerSelect}
          />
        )}
      </main>
    </div>
  );
};

export default CampaignQuiz;
