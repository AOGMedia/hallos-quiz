import { useState } from "react";
import Onboarding from "@/pages/Onboarding";
import ProfileSetup from "@/pages/ProfileSetup";
import Lobby from "@/pages/Lobby";
import { avatars } from "@/data/gameData";

type AppState = "onboarding" | "profile" | "lobby";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("onboarding");
  const [userProfile, setUserProfile] = useState({
    nickname: "",
    avatar: avatars[0],
  });

  const handleOnboardingComplete = () => {
    setAppState("profile");
  };

  const handleProfileComplete = (profile: { nickname: string; avatar: string }) => {
    setUserProfile(profile);
    setAppState("lobby");
  };

  const handleExit = () => {
    setAppState("onboarding");
  };

  switch (appState) {
    case "onboarding":
      return <Onboarding onComplete={handleOnboardingComplete} />;
    case "profile":
      return <ProfileSetup onComplete={handleProfileComplete} />;
    case "lobby":
      return <Lobby userProfile={userProfile} onExit={handleExit} />;
    default:
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }
};

export default Index;
