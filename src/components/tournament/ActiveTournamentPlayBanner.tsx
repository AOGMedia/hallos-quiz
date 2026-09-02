import { Trophy, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMyActiveTournamentPlay } from "@/hooks/useTournament";
import { joinMatch } from "@/lib/socket/emitters";
import { joinTournament } from "@/lib/socket/tournamentEmitters";
import { getMyUserId } from "@/lib/auth/currentUser";
import { FORMAT_LABELS } from "@/lib/api/tournament";

/**
 * Persistent, always-visible answer to "where do I join my tournament?" —
 * the counterpart to the one-shot 'challenge_accepted'/'round_started' socket
 * pushes, which only work if the player happens to be online and connected at
 * the exact moment they fire. Backed by useMyActiveTournamentPlay, which polls
 * a REST endpoint as a self-healing baseline and gets invalidated instantly by
 * TournamentWatcher when a live push does land.
 *
 * Renders nothing on /game and /tournament/play — the player is already where
 * this would send them.
 */
const ActiveTournamentPlayBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useMyActiveTournamentPlay();

  if (!data || data.type === "none") return null;
  if (location.pathname === "/game" || location.pathname === "/tournament/play") return null;

  const handleJoinKnockoutMatch = () => {
    if (data.type !== "knockout_match") return;

    const stored = sessionStorage.getItem("userProfile");
    const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };

    sessionStorage.removeItem("matchEnded");
    sessionStorage.setItem("currentMatch", JSON.stringify({
      matchId: data.matchId,
      player1: { name: me.nickname, avatar: me.avatar },
      player2: { userId: data.opponent.userId, name: data.opponent.nickname, avatar: data.opponent.avatarUrl },
      questions: data.questions,
      challengerId: getMyUserId(),
      tournamentId: data.tournamentId,
      roundNumber: data.roundNumber,
    }));
    sessionStorage.setItem("currentTournamentId", data.tournamentId);

    joinMatch(data.matchId);
    navigate("/game");
  };

  const handleJoinSharedRound = () => {
    if (data.type !== "shared_round") return;

    sessionStorage.setItem("currentTournamentRound", JSON.stringify({
      tournamentId: data.tournamentId,
      roundNumber: data.roundNumber,
      format: data.format,
      questions: [], // hydrated from the server by useTournamentRound on the play screen
    }));
    sessionStorage.setItem("currentTournamentId", data.tournamentId);
    sessionStorage.removeItem("currentTournamentBye");

    joinTournament(data.tournamentId);
    navigate("/tournament/play");
  };

  const label =
    data.type === "knockout_match"
      ? `Your match vs ${data.opponent.nickname} is ready`
      : `Round ${data.roundNumber} of ${data.tournamentName ?? (data.format ? FORMAT_LABELS[data.format] : "your tournament")} is live`;

  return (
    <button
      onClick={data.type === "knockout_match" ? handleJoinKnockoutMatch : handleJoinSharedRound}
      className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-accent/10 border-b border-accent/30 hover:bg-accent/15 transition-colors text-left"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Trophy className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
      </div>
      <span className="flex items-center gap-1 text-xs font-semibold text-accent shrink-0">
        Join Now
        <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </button>
  );
};

export default ActiveTournamentPlayBanner;
