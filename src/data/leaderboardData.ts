import type {
  GlobalRankingEntry,
  LobbyRankingEntry,
  TournamentRankingEntry,
} from "@/lib/api/leaderboard";

export const mockGlobalRankings: GlobalRankingEntry[] = [
  { rank: 1,  userId: 1,  nickname: "QuizMaster",    totalWinnings: 50000, totalMatches: 200, winRate: 75.5, accuracy: 88.2 },
  { rank: 2,  userId: 2,  nickname: "BrainBox",       totalWinnings: 45000, totalMatches: 180, winRate: 72.0, accuracy: 85.5 },
  { rank: 3,  userId: 3,  nickname: "MidnightBolt",   totalWinnings: 38000, totalMatches: 160, winRate: 68.5, accuracy: 82.1 },
  { rank: 4,  userId: 4,  nickname: "TriviaNova",     totalWinnings: 32000, totalMatches: 145, winRate: 65.0, accuracy: 79.8 },
  { rank: 5,  userId: 5,  nickname: "LogicKing",      totalWinnings: 28000, totalMatches: 130, winRate: 63.2, accuracy: 77.4 },
  { rank: 6,  userId: 6,  nickname: "BrainBlitz",     totalWinnings: 24000, totalMatches: 120, winRate: 61.0, accuracy: 75.0 },
  { rank: 7,  userId: 7,  nickname: "QuizWhizX",      totalWinnings: 20000, totalMatches: 110, winRate: 58.5, accuracy: 73.2 },
  { rank: 8,  userId: 8,  nickname: "FactHacker",     totalWinnings: 17000, totalMatches: 100, winRate: 56.0, accuracy: 71.5 },
  { rank: 9,  userId: 9,  nickname: "SmartyPulse",    totalWinnings: 14000, totalMatches: 90,  winRate: 54.0, accuracy: 69.8 },
  { rank: 10, userId: 10, nickname: "TriviaChamp",    totalWinnings: 11000, totalMatches: 80,  winRate: 52.0, accuracy: 68.0 },
];

export const mockLobbyRankings: LobbyRankingEntry[] = [
  { rank: 1,  userId: 1,  nickname: "QuizMaster",   lobbyWinnings: 30000, lobbyMatches: 150, lobbyWinRate: 78.0 },
  { rank: 2,  userId: 3,  nickname: "MidnightBolt", lobbyWinnings: 22000, lobbyMatches: 120, lobbyWinRate: 71.5 },
  { rank: 3,  userId: 2,  nickname: "BrainBox",     lobbyWinnings: 18000, lobbyMatches: 110, lobbyWinRate: 68.0 },
  { rank: 4,  userId: 6,  nickname: "BrainBlitz",   lobbyWinnings: 14000, lobbyMatches: 95,  lobbyWinRate: 64.0 },
  { rank: 5,  userId: 5,  nickname: "LogicKing",    lobbyWinnings: 11000, lobbyMatches: 85,  lobbyWinRate: 61.0 },
  { rank: 6,  userId: 7,  nickname: "QuizWhizX",    lobbyWinnings: 9000,  lobbyMatches: 75,  lobbyWinRate: 58.0 },
  { rank: 7,  userId: 4,  nickname: "TriviaNova",   lobbyWinnings: 7500,  lobbyMatches: 65,  lobbyWinRate: 55.0 },
  { rank: 8,  userId: 8,  nickname: "FactHacker",   lobbyWinnings: 6000,  lobbyMatches: 55,  lobbyWinRate: 52.0 },
  { rank: 9,  userId: 9,  nickname: "SmartyPulse",  lobbyWinnings: 4500,  lobbyMatches: 45,  lobbyWinRate: 49.0 },
  { rank: 10, userId: 10, nickname: "TriviaChamp",  lobbyWinnings: 3000,  lobbyMatches: 35,  lobbyWinRate: 46.0 },
];

export const mockTournamentRankings: TournamentRankingEntry[] = [
  { rank: 1,  userId: 2,  nickname: "BrainBox",      tournamentWinnings: 20000, tournamentsWon: 5, top3Finishes: 12 },
  { rank: 2,  userId: 4,  nickname: "TriviaNova",     tournamentWinnings: 15000, tournamentsWon: 4, top3Finishes: 10 },
  { rank: 3,  userId: 1,  nickname: "QuizMaster",     tournamentWinnings: 12000, tournamentsWon: 3, top3Finishes: 9  },
  { rank: 4,  userId: 7,  nickname: "QuizWhizX",      tournamentWinnings: 9000,  tournamentsWon: 2, top3Finishes: 7  },
  { rank: 5,  userId: 5,  nickname: "LogicKing",      tournamentWinnings: 7000,  tournamentsWon: 2, top3Finishes: 6  },
  { rank: 6,  userId: 3,  nickname: "MidnightBolt",   tournamentWinnings: 5500,  tournamentsWon: 1, top3Finishes: 5  },
  { rank: 7,  userId: 10, nickname: "TriviaChamp",    tournamentWinnings: 4000,  tournamentsWon: 1, top3Finishes: 4  },
  { rank: 8,  userId: 6,  nickname: "BrainBlitz",     tournamentWinnings: 3000,  tournamentsWon: 1, top3Finishes: 3  },
  { rank: 9,  userId: 8,  nickname: "FactHacker",     tournamentWinnings: 2000,  tournamentsWon: 0, top3Finishes: 2  },
  { rank: 10, userId: 9,  nickname: "SmartyPulse",    tournamentWinnings: 1000,  tournamentsWon: 0, top3Finishes: 1  },
];

export const mockUserRank = 15;
export const mockTotalPlayers = 1000;
export const mockActiveUsers = 247;
