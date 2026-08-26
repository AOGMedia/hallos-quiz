import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import ProfileSetup from "./pages/ProfileSetup";
import AppLayout from "./components/layout/AppLayout";
import Lobby from "./pages/Lobby";
import Tournament from "./pages/Tournament";
import Leaderboard from "./pages/Leaderboard";
import ChutaWallet from "./pages/ChutaWallet";
import Identity from "./pages/Identity";
import Gameplay from "./pages/Gameplay";
import Guide from "./pages/Guide";
import Chat from "./pages/Chat";
import CampaignQuiz from "./pages/CampaignQuiz";
import InviteLanding from "./pages/InviteLanding";
import PendingInviteWatcher from "./components/invite/PendingInviteWatcher";
import InviteNotifications from "./components/invite/InviteNotifications";
import TournamentWatcher from "./components/tournament/TournamentWatcher";
import TournamentGameplay from "./pages/TournamentGameplay";
import NotFound from "./pages/NotFound";
import { getToken } from "./store/authStore";

/** Returns true if the user has a valid token + a persisted registered profile */
function isRegisteredUser(): boolean {
  if (!getToken()) return false;
  try {
    const stored = localStorage.getItem("quiz-profile");
    if (!stored) return false;
    const { state } = JSON.parse(stored);
    return !!state?.isRegistered;
  } catch {
    return false;
  }
}

/** Blocks access to onboarding/profile-setup for registered users */
const GuestOnlyRoute = ({ element }: { element: React.ReactElement }) =>
  isRegisteredUser() ? <Navigate to="/lobby" replace /> : element;

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        {/* Guest-only routes — registered users are redirected to /lobby */}
        <Route path="/" element={<GuestOnlyRoute element={<Onboarding />} />} />
        <Route path="/profile" element={<GuestOnlyRoute element={<ProfileSetup />} />} />

        <Route path="/game" element={<Gameplay />} />
        <Route path="/tournament/play" element={<TournamentGameplay />} />
        <Route path="/campaign/quiz" element={<CampaignQuiz />} />
        {/* Invite token is a PATH param — never `?token=`, which main.tsx
            treats as the auth JWT and would overwrite the user's session.
            Reached via hallos.net/dashboard/games/invite/<token>, which
            authenticates and forwards here with ?token=<jwt> attached. */}
        <Route path="/invite/:token" element={<InviteLanding />} />

        {/* App shell — shared Sidebar + TopBar */}
        <Route element={<AppLayout />}>
          <Route path="/lobby"       element={<Lobby />} />
          <Route path="/tournament"  element={<Tournament />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/wallet"      element={<ChutaWallet />} />
          <Route path="/identity"    element={<Identity />} />
          <Route path="/guide"       element={<Guide />} />
          <Route path="/chat"        element={<Chat />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Self-contained; no-op without a JWT. PendingInviteWatcher/InviteNotifications
          never navigate on their own; TournamentWatcher does (round/match start). */}
      <PendingInviteWatcher />
      <InviteNotifications />
      <TournamentWatcher />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
