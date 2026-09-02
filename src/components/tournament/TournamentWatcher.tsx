import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket/socket";
import { joinMatch } from "@/lib/socket/emitters";
import { leaveTournament } from "@/lib/socket/tournamentEmitters";
import { getToken } from "@/store/authStore";
import { getMyUserId } from "@/lib/auth/currentUser";
import { TOURNAMENT_KEYS } from "@/hooks/useTournament";
import type {
  ChallengeAcceptedPayload,
  RoundStartedPayload,
  TournamentStartedPayload,
  TournamentEndedPayload,
  TournamentByePayload,
  ParticipantEliminatedPayload,
  ParticipantForfeitedPayload,
  ParticipantDisconnectedPayload,
  TournamentProposalReviewedPayload,
} from "@/lib/socket/events";

/**
 * Global, page-independent handling for tournament events the user needs to
 * react to no matter where they are in the app — a knockout match starting, a
 * shared-question round starting, a bye, an elimination, or the tournament
 * ending.
 *
 * Also owns the tournament room's lifecycle. Joining happens where the user
 * enters a tournament (detail view, round start); *leaving* happens here, when
 * they're actually out — eliminated, forfeited, or the tournament finished.
 * Tying the room to a screen's lifetime would be wrong in both directions: the
 * subscription has to outlive the gameplay screen (rounds are separated by time
 * on the standings page), but it must not outlive the tournament, or a later
 * `round_started` from an event we've left drags us back into gameplay.
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getToken()) return;

    const socket = getSocket();

    /** Drop every trace of a tournament we're no longer part of. */
    const exitTournament = (tournamentId: string) => {
      leaveTournament(tournamentId);
      if (sessionStorage.getItem("currentTournamentId") === tournamentId) {
        sessionStorage.removeItem("currentTournamentId");
      }
      sessionStorage.removeItem("currentTournamentRound");
      sessionStorage.removeItem("currentTournamentBye");
    };

    const refreshTournament = (tournamentId: string) => {
      queryClient.invalidateQueries({ queryKey: ["tournaments", "leaderboard", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournaments", "detail", tournamentId] });
      // Covers the "no longer have something to join" cases too — elimination,
      // forfeit, and tournament end all route through here.
      queryClient.invalidateQueries({ queryKey: TOURNAMENT_KEYS.activePlay });
    };

    const handleChallengeAccepted = (payload: ChallengeAcceptedPayload) => {
      if (!payload.tournamentId) return; // non-tournament matches are Lobby.tsx's job

      const stored = sessionStorage.getItem("userProfile");
      const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };

      sessionStorage.removeItem("matchEnded");
      sessionStorage.setItem("currentMatch", JSON.stringify({
        matchId: payload.matchId,
        player1: { name: me.nickname, avatar: me.avatar },
        player2: { userId: payload.opponent.userId, name: payload.opponent.nickname, avatar: payload.opponent.avatarUrl },
        questions: payload.questions,
        challengerId: getMyUserId(),
        tournamentId: payload.tournamentId,
        roundNumber: payload.roundNumber,
      }));
      sessionStorage.setItem("currentTournamentId", payload.tournamentId);
      queryClient.invalidateQueries({ queryKey: TOURNAMENT_KEYS.activePlay });

      joinMatch(payload.matchId);
      toast.success("Your tournament match is ready!");
      navigate("/game");
    };

    const handleTournamentStarted = (payload: TournamentStartedPayload) => {
      toast.success(
        `Tournament under way — ${payload.participantCount} players, ${payload.totalRounds} rounds. Good luck!`
      );
      sessionStorage.setItem("currentTournamentId", payload.tournamentId);
      refreshTournament(payload.tournamentId);
    };

    const handleRoundStarted = (payload: RoundStartedPayload) => {
      // Knockout rounds are matches — challenge_accepted (above) handles those.
      if (payload.format === "knockout" || !payload.questions) return;

      sessionStorage.setItem("currentTournamentRound", JSON.stringify({
        tournamentId: payload.tournamentId,
        roundNumber: payload.roundNumber,
        format: payload.format,
        questions: payload.questions,
        timeLimit: payload.timeLimit,
      }));
      sessionStorage.setItem("currentTournamentId", payload.tournamentId);
      sessionStorage.removeItem("currentTournamentBye"); // a real round supersedes any bye
      queryClient.invalidateQueries({ queryKey: TOURNAMENT_KEYS.activePlay });

      toast.success(`Round ${payload.roundNumber} is starting!`);
      navigate("/tournament/play");
    };

    const handleTournamentBye = (payload: TournamentByePayload) => {
      // A bye means there's no round to play, but the player is still very much
      // in the tournament — give them the same full-screen surface the round
      // would have used, rather than only a toast they might miss.
      sessionStorage.setItem("currentTournamentBye", JSON.stringify({
        tournamentId: payload.tournamentId,
        roundNumber: payload.roundNumber,
      }));
      sessionStorage.setItem("currentTournamentId", payload.tournamentId);
      sessionStorage.removeItem("currentTournamentRound");

      toast.info(`You drew a bye — you advance to round ${payload.roundNumber + 1}.`);
      refreshTournament(payload.tournamentId);
      navigate("/tournament/play");
    };

    const handleParticipantEliminated = (payload: ParticipantEliminatedPayload) => {
      refreshTournament(payload.tournamentId);
      if (payload.userId !== getMyUserId()) return;

      // Our own elimination: the gameplay screen renders its own state for
      // this, so only toast when we're somewhere else in the app.
      if (!window.location.pathname.startsWith("/tournament/play")) {
        toast.info(`You've been eliminated in round ${payload.roundNumber}.`);
      }
      exitTournament(payload.tournamentId);
    };

    const handleParticipantForfeited = (payload: ParticipantForfeitedPayload) => {
      refreshTournament(payload.tournamentId);
      if (payload.userId === getMyUserId()) exitTournament(payload.tournamentId);
    };

    const handleParticipantDisconnected = (payload: ParticipantDisconnectedPayload) => {
      refreshTournament(payload.tournamentId);
    };

    const handleTournamentEnded = (payload: TournamentEndedPayload) => {
      refreshTournament(payload.tournamentId);
      queryClient.invalidateQueries({ queryKey: ["tournaments", "mine"] });

      // The room broadcast has no `placement`; the direct-to-user variant does.
      if (payload.placement === undefined) return;

      if (payload.placement === 1) {
        toast.success(`🏆 You won the tournament! +${payload.prizeWon ?? 0} MP`);
      } else if (payload.placement <= 3) {
        toast.success(`Tournament over — you placed #${payload.placement}! +${payload.prizeWon ?? 0} MP`);
      } else {
        toast.info("Tournament over — better luck next time!");
      }
      exitTournament(payload.tournamentId);
    };

    const handleProposalApproved = (payload: TournamentProposalReviewedPayload) => {
      toast.success("Your tournament proposal was approved and is now open for registration!");
      queryClient.invalidateQueries({ queryKey: ["tournaments", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments", "list"] });
    };

    const handleProposalRejected = (payload: TournamentProposalReviewedPayload) => {
      toast.error(
        payload.reason
          ? `Your tournament proposal was declined: ${payload.reason}`
          : "Your tournament proposal was declined."
      );
      queryClient.invalidateQueries({ queryKey: ["tournaments", "mine"] });
    };

    socket.on("challenge_accepted", handleChallengeAccepted);
    socket.on("tournament_started", handleTournamentStarted);
    socket.on("round_started", handleRoundStarted);
    socket.on("tournament_bye", handleTournamentBye);
    socket.on("participant_eliminated", handleParticipantEliminated);
    socket.on("participant_forfeited", handleParticipantForfeited);
    socket.on("participant_disconnected", handleParticipantDisconnected);
    socket.on("tournament_ended", handleTournamentEnded);
    socket.on("tournament_proposal_approved", handleProposalApproved);
    socket.on("tournament_proposal_rejected", handleProposalRejected);

    return () => {
      socket.off("challenge_accepted", handleChallengeAccepted);
      socket.off("tournament_started", handleTournamentStarted);
      socket.off("round_started", handleRoundStarted);
      socket.off("tournament_bye", handleTournamentBye);
      socket.off("participant_eliminated", handleParticipantEliminated);
      socket.off("participant_forfeited", handleParticipantForfeited);
      socket.off("participant_disconnected", handleParticipantDisconnected);
      socket.off("tournament_ended", handleTournamentEnded);
      socket.off("tournament_proposal_approved", handleProposalApproved);
      socket.off("tournament_proposal_rejected", handleProposalRejected);
    };
  }, [navigate, queryClient]);

  return null;
};

export default TournamentWatcher;
