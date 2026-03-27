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

        {/* App shell — shared Sidebar + TopBar */}
        <Route element={<AppLayout />}>
          <Route path="/lobby"       element={<Lobby />} />
          <Route path="/tournament"  element={<Tournament />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/wallet"      element={<ChutaWallet />} />
          <Route path="/identity"    element={<Identity />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
