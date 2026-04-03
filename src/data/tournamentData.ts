/**
 * Sample tournament data — aligned with the backend API types
 * (Tournament / TournamentDetail from @/lib/api/tournament).
 *
 * Once real tournaments exist in the database the UI will prefer
 * server data automatically; these samples are only shown as a
 * fallback when the API has no tournaments yet.
 */

import type { Tournament, TournamentDetail, TournamentFormat } from "@/lib/api/tournament";

// ── Re-export the canonical format type so legacy imports keep working ────────
export type { TournamentFormat };

// ── Helpers for mock dates (relative to "now") ───────────────────────────────

/** Returns an ISO date-string `hoursFromNow` hours in the future */
const futureDate = (hoursFromNow: number) =>
  new Date(Date.now() + hoursFromNow * 3600_000).toISOString();

// ── Featured tournament ──────────────────────────────────────────────────────

export const featuredTournament: Tournament & {
  icon: string;
  isFeatured: boolean;
  liveIn: string;
} = {
  id: "featured-1",
  name: "Lagos State Math Championship",
  description:
    "The biggest event of the week. 100 players enter, one survives. Knowledge is your only weapon in this battle royale format",
  format: "battle_royale",
  entryFee: 500,
  prizePool: 50_000,
  prizeDistribution: { first: 50, second: 30, third: 20 },
  categoryId: "math-101",
  categoryName: "Mathematics",
  maxParticipants: 100,
  currentParticipants: 84,
  registrationDeadline: futureDate(2),
  startTime: futureDate(2.25),
  status: "open",
  createdBy: 0,
  // Extra display-only fields
  icon: "🏆",
  isFeatured: true,
  liveIn: "2H 14MIN",
};

// ── Main tournament list ─────────────────────────────────────────────────────

export const tournaments: (Tournament & { icon: string })[] = [
  {
    id: "sample-1",
    name: "Science Sprints",
    description: "Race against the clock in rapid-fire science questions",
    format: "speed_run",
    entryFee: 100,
    prizePool: 10_000,
    prizeDistribution: { first: 50, second: 30, third: 20 },
    categoryId: "sci-101",
    categoryName: "Science",
    maxParticipants: 100,
    currentParticipants: 84,
    registrationDeadline: futureDate(6),
    startTime: futureDate(8),
    status: "open",
    createdBy: 0,
    icon: "🧪",
  },
  {
    id: "sample-2",
    name: "General Knowledge",
    description: "Test your breadth of knowledge across all subjects",
    format: "classic",
    entryFee: 200,
    prizePool: 12_000,
    prizeDistribution: { first: 50, second: 30, third: 20 },
    categoryId: "gk-101",
    categoryName: "General Knowledge",
    maxParticipants: 1000,
    currentParticipants: 758,
    registrationDeadline: futureDate(12),
    startTime: futureDate(14),
    status: "open",
    createdBy: 0,
    icon: "🧠",
  },
  {
    id: "sample-3",
    name: "Math Duel",
    description: "Head-to-head elimination rounds of mental math",
    format: "knockout",
    entryFee: 150,
    prizePool: 7_500,
    prizeDistribution: { first: 50, second: 30, third: 20 },
    categoryId: "math-101",
    categoryName: "Mathematics",
    maxParticipants: 100,
    currentParticipants: 90,
    registrationDeadline: futureDate(3),
    startTime: futureDate(4),
    status: "open",
    createdBy: 0,
    icon: "🔢",
  },
  {
    id: "sample-4",
    name: "Programming Championship",
    description: "Survive wave after wave of coding challenges",
    format: "battle_royale",
    entryFee: 500,
    prizePool: 50_000,
    prizeDistribution: { first: 50, second: 30, third: 20 },
    categoryId: "prog-101",
    categoryName: "Programming",
    maxParticipants: 1000,
    currentParticipants: 1000,
    registrationDeadline: futureDate(-1),
    startTime: futureDate(0),
    status: "in_progress",
    createdBy: 0,
    icon: "💻",
  },
  {
    id: "sample-5",
    name: "English & Grammar Wars",
    description: "Elimination rounds testing grammar, vocab, and comprehension",
    format: "knockout",
    entryFee: 50,
    prizePool: 1_000,
    prizeDistribution: { first: 50, second: 30, third: 20 },
    categoryId: "eng-101",
    categoryName: "English",
    maxParticipants: 100,
    currentParticipants: 8,
    registrationDeadline: futureDate(24),
    startTime: futureDate(26),
    status: "open",
    createdBy: 0,
    icon: "📝",
  },
  {
    id: "sample-6",
    name: "Geography",
    description: "Speed round covering world capitals, maps, and landmarks",
    format: "speed_run",
    entryFee: 100,
    prizePool: 15_000,
    prizeDistribution: { first: 50, second: 30, third: 20 },
    categoryId: "geo-101",
    categoryName: "Geography",
    maxParticipants: 100,
    currentParticipants: 43,
    registrationDeadline: futureDate(10),
    startTime: futureDate(12),
    status: "open",
    createdBy: 0,
    icon: "🌍",
  },
];

// ── History (display-only, no API mapping needed) ────────────────────────────

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

export const tournamentHistory: TournamentHistoryItem[] = [
  { id: "h1", date: "JAN 05, 2026", name: "Science Sprints",             format: "speed_run",     entry: 100, result: "🏆 1st place", zpWonLost:  900, icon: "🧪" },
  { id: "h2", date: "JAN 02, 2026", name: "General Knowledge",           format: "classic",       entry: 200, result: "Round 10",     zpWonLost: -200, icon: "🧠" },
  { id: "h3", date: "DEC 23, 2025", name: "Math Duel",                   format: "knockout",      entry: 150, result: "Round 3",      zpWonLost: -150, icon: "🔢" },
  { id: "h4", date: "DEC 19, 2025", name: "Programming Championship",    format: "battle_royale", entry: 500, result: "Top 10",       zpWonLost:  500, icon: "💻" },
  { id: "h5", date: "DEC 09, 2025", name: "English and grammar wars",    format: "knockout",      entry:  50, result: "Final round",  zpWonLost:  300, icon: "📝" },
  { id: "h6", date: "NOV 13, 2025", name: "Geography",                   format: "speed_run",     entry: 100, result: "🥈 2nd place", zpWonLost:  600, icon: "🌍" },
];

// ── Category options for "Host Tournament" form ──────────────────────────────

export const categoryOptions = [
  "JAMB",
  "WAEC",
  "NECO",
  "GRE",
  "SAT",
  "General Knowledge",
];

// ── Lookup helper ────────────────────────────────────────────────────────────

const SAMPLE_IDS = new Set([featuredTournament.id, ...tournaments.map((t) => t.id)]);

/** Returns true if the id belongs to our local sample data */
export const isSampleTournament = (id: string): boolean => SAMPLE_IDS.has(id);

/**
 * Build a mock TournamentDetail response for a sample tournament.
 * Returns null if the id is not a sample.
 */
export const getSampleTournamentDetail = (
  id: string
): { tournament: TournamentDetail; participantCount: number; prizePool: number; participantsHidden: boolean } | null => {
  const all = [featuredTournament, ...tournaments];
  const t = all.find((x) => x.id === id);
  if (!t) return null;

  const detail: TournamentDetail = {
    ...t,
    minParticipants: 2,
    currentRound: 0,
    totalRounds: 5,
    participants: [],
    createdAt: new Date().toISOString(),
  };

  return {
    tournament: detail,
    participantCount: t.currentParticipants,
    prizePool: t.prizePool,
    participantsHidden: true,
  };
};
