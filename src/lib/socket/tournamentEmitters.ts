import { getSocket } from "./socket";

export const joinTournament = (tournamentId: string): void => {
  getSocket().emit("join_tournament", { tournamentId });
};

export const leaveTournament = (tournamentId: string): void => {
  getSocket().emit("leave_tournament", { tournamentId });
};

/**
 * Submit an answer for a shared-question-set tournament round
 * (classic / speed_run / battle_royale). Knockout matches use the regular
 * `submitAnswer` match emitter instead — see @/lib/socket/emitters.
 */
export const submitTournamentAnswer = (payload: {
  tournamentId: string;
  roundNumber: number;
  questionId: string;
  answerId: string;
  clientTimestamp: number;
}): void => {
  getSocket().emit("submit_tournament_answer", payload);
};
