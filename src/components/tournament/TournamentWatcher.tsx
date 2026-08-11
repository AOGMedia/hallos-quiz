import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket/socket";
import { joinMatch } from "@/lib/socket/emitters";
import { getToken } from "@/store/authStore";
import type {
  ChallengeAcceptedPayload,
  RoundStartedPayload,
  TournamentEndedPayload,
  TournamentByePayload,
  TournamentProposalReviewedPayload,
} from "@/lib/socket/events";

function getMyId(): number | null {
  try {
    const token = sessionStorage.getItem("auth_token");
    if (!token) return null;
    return Number(JSON.parse(atob(token.split(".")[1]))?.id);
  } catch {
    return null;
  }
}

/**
 * Global, page-independent handling for tournament events the user needs to
 * react to no matter where they are in the app — a knockout match starting,
 * a shared-question round starting, a bye, or the tournament ending.
 *
 * Self-contained on purpose, same reasoning as InviteNotifications: it
 * registers raw socket listeners directly (not the shared on/off helpers in
 * events.ts) so it can't collide with any component-local listener for the
 * same event name — e.g. Lobby.tsx's own `challenge_accepted` handler, which
 * explicitly ignores tournament-flavored payloads so this watcher is the
 * single source of truth for those.
 */
const TournamentWatcher = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) return;

    const socket = getSocket();

    const handleChallengeAccepted = (payload: ChallengeAcceptedPayload) => {
      if (!payload.tournamentId) return; // non-tournament matches are Lobby.tsx's job

      const stored = sessionStorage.getItem("userProfile");
      const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };

      sessionStorage.removeItem("matchEnded");
      sessionStorage.setItem("currentMatch", JSON.stringify({
        matchId: payload.matchId,
        player1: { name: me.nickname, avatar: me.avatar },
        player2: { name: payload.opponent.nickname, avatar: payload.opponent.avatarUrl },
        questions: payload.questions,
        challengerId: getMyId(),
        tournamentId: payload.tournamentId,
        roundNumber: payload.roundNumber,
      }));
      sessionStorage.setItem("currentTournamentId", payload.tournamentId);

      joinMatch(payload.matchId);
      toast.success("Your tournament match is ready!");
      navigate("/game");
    };

    const handleRoundStarted = (payload: RoundStartedPayload) => {
      // Knockout rounds are matches — challenge_accepted (above) handles those.
      if (payload.format === "knockout" || !payload.questions) return;

      sessionStorage.setItem("currentTournamentRound", JSON.stringify({
        tournamentId: payload.tournamentId,
        roundNumber: payload.roundNumber,
        format: payload.format,
        questions: payload.questions,
      }));
      sessionStorage.setItem("currentTournamentId", payload.tournamentId);

      toast.success(`Round ${payload.roundNumber} is starting!`);
      navigate("/tournament/play");
    };

    const handleTournamentBye = (payload: TournamentByePayload) => {
      toast.info(`You drew a bye this round — auto-advancing to round ${payload.roundNumber + 1}.`);
    };

    const handleTournamentEnded = (payload: TournamentEndedPayload) => {
      // Direct-to-user variant carries `placement`/`prizeWon` at the top level
      if (payload.placement === undefined) return;
      if (payload.placement === 1) {
        toast.success(`🏆 You won the tournament! +${payload.prizeWon ?? 0} MP`);
      } else if (payload.placement <= 3) {
        toast.success(`Tournament over — you placed #${payload.placement}! +${payload.prizeWon ?? 0} MP`);
      } else {
        toast.info("Tournament over — better luck next time!");
      }
      sessionStorage.removeItem("currentTournamentId");
      sessionStorage.removeItem("currentTournamentRound");
    };

    const handleProposalApproved = (payload: TournamentProposalReviewedPayload) => {
      toast.success("Your tournament proposal was approved and is now open for registration!");
    };

    const handleProposalRejected = (payload: TournamentProposalReviewedPayload) => {
      toast.error(payload.reason ? `Your tournament proposal was declined: ${payload.reason}` : "Your tournament proposal was declined.");
    };

    socket.on("challenge_accepted", handleChallengeAccepted);
    socket.on("round_started", handleRoundStarted);
    socket.on("tournament_bye", handleTournamentBye);
    socket.on("tournament_ended", handleTournamentEnded);
    socket.on("tournament_proposal_approved", handleProposalApproved);
    socket.on("tournament_proposal_rejected", handleProposalRejected);

    return () => {
      socket.off("challenge_accepted", handleChallengeAccepted);
      socket.off("round_started", handleRoundStarted);
      socket.off("tournament_bye", handleTournamentBye);
      socket.off("tournament_ended", handleTournamentEnded);
      socket.off("tournament_proposal_approved", handleProposalApproved);
      socket.off("tournament_proposal_rejected", handleProposalRejected);
    };
  }, [navigate]);

  return null;
};

export default TournamentWatcher;
