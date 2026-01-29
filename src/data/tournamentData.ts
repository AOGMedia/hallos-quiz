import avatar1 from "@/assets/avatars/avatar-1.png";
import avatar2 from "@/assets/avatars/avatar-2.png";
import avatar3 from "@/assets/avatars/avatar-3.png";
import avatar4 from "@/assets/avatars/avatar-4.png";
import avatar5 from "@/assets/avatars/avatar-5.png";
import avatar6 from "@/assets/avatars/avatar-6.png";

export type TournamentFormat = "Battle Royale" | "Speed Run" | "Knockout" | "Classic";

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  entry: number;
  prizePool: number;
  quota: { current: number; max: number };
  icon: string;
  isFeatured?: boolean;
  liveIn?: string;
  description?: string;
}

export interface TournamentHistoryItem {
  id: string;
  date: string;
  name: string;
  format: TournamentFormat;
  entry: number;
  result: string;
  zpWonLost: number;
  icon: string;
}

export const featuredTournament: Tournament = {
  id: "featured-1",
  name: "Lagos State Math Championship",
  format: "Battle Royale",
  entry: 500,
  prizePool: 50000,
  quota: { current: 84, max: 100 },
  icon: "🏆",
  isFeatured: true,
  liveIn: "2H 14MIN",
  description: "The biggest event of the week. 100 players enter, one survives. Knowledge is your only weapon in this battle royale format",
};

export const tournaments: Tournament[] = [
  { id: "1", name: "Science Sprints", format: "Speed Run", entry: 100, prizePool: 10000, quota: { current: 84, max: 100 }, icon: "🧪" },
  { id: "2", name: "General Knowledge", format: "Classic", entry: 200, prizePool: 12000, quota: { current: 758, max: 1000 }, icon: "🧠" },
  { id: "3", name: "Math Duel", format: "Knockout", entry: 150, prizePool: 7500, quota: { current: 90, max: 100 }, icon: "🔢" },
  { id: "4", name: "Programming Championship", format: "Battle Royale", entry: 500, prizePool: 50000, quota: { current: 1000, max: 1000 }, icon: "💻" },
  { id: "5", name: "English and grammar wars", format: "Knockout", entry: 50, prizePool: 1000, quota: { current: 8, max: 100 }, icon: "📝" },
  { id: "6", name: "Geography", format: "Speed Run", entry: 100, prizePool: 15000, quota: { current: 43, max: 100 }, icon: "🌍" },
];

export const tournamentHistory: TournamentHistoryItem[] = [
  { id: "1", date: "JAN 05, 2026", name: "Science Sprints", format: "Speed Run", entry: 100, result: "🏆 1st place", zpWonLost: 900, icon: "🧪" },
  { id: "2", date: "JAN 02, 2026", name: "General Knowledge", format: "Classic", entry: 200, result: "Round 10", zpWonLost: -200, icon: "🧠" },
  { id: "3", date: "DEC 23, 2025", name: "Math Duel", format: "Knockout", entry: 150, result: "Round 3", zpWonLost: -150, icon: "🔢" },
  { id: "4", date: "DEC 19, 2025", name: "Programming Championship", format: "Battle Royale", entry: 500, result: "Top 10", zpWonLost: 500, icon: "💻" },
  { id: "5", date: "DEC 09, 2025", name: "English and grammar wars", format: "Knockout", entry: 50, result: "Final round", zpWonLost: 300, icon: "📝" },
  { id: "6", date: "NOV 13, 2025", name: "Geography", format: "Speed Run", entry: 100, result: "🥈 2nd place", zpWonLost: 600, icon: "🌍" },
];

export const categoryOptions = [
  "JAMB",
  "WAEC",
  "NECO",
  "GRE",
  "SAT",
  "General Knowledge",
];
