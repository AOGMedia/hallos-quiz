import { useState } from "react";
import { ArrowLeft, ChevronDown, Check, Upload, X } from "lucide-react";
import AahbibiLogo from "@/components/icons/AahbibiLogo";
import { avatars } from "@/data/gameData";

interface ProfileSetupProps {
  onComplete: (profile: { nickname: string; avatar: string }) => void;
}

const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [nickname, setNickname] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleStartPlaying = () => {
    if (nickname && agreedToTerms) {
      onComplete({ nickname, avatar: selectedAvatar });
    }
  };

  const isValid = nickname.length > 0 && agreedToTerms;

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Exit button */}
      <button className="btn-exit absolute top-6 left-6 z-10">
        <ArrowLeft className="w-4 h-4" />
        EXIT
      </button>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center space-y-8">
          {/* Logo */}
          <AahbibiLogo className="h-10 justify-center mx-auto" />

          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hi, Kingsley</h1>
            <p className="text-muted-foreground mt-1">Setup your game profile to get started</p>
          </div>

          {/* Avatar selection */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose your Hero Avatar</p>
            <div className="flex items-center justify-center gap-3">
              {avatars.slice(0, 5).map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar ? "border-primary scale-110" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              ))}
              <button
                onClick={() => setShowAvatarModal(true)}
                className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nickname input */}
          <div>
            <input
              type="text"
              placeholder="Enter Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-dark w-full text-center"
            />
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-3 text-left">
            <button
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
                agreedToTerms ? "bg-primary border-primary" : "border-muted-foreground"
              }`}
            >
              {agreedToTerms && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
            <p className="text-sm text-muted-foreground">
              By checking this box you agree to the{" "}
              <a href="#" className="text-primary hover:underline">terms of use</a> and{" "}
              <a href="#" className="text-primary hover:underline">privacy policy</a>
            </p>
          </div>

          {/* Start playing button */}
          <button
            onClick={handleStartPlaying}
            disabled={!isValid}
            className={`btn-primary w-full ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Start Playing
          </button>
        </div>
      </div>

      {/* Avatar selection modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full animate-scale-in">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {[...avatars, ...avatars, ...avatars].slice(0, 15).map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    setShowAvatarModal(false);
                  }}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <button className="btn-ghost w-full flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload custom file
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSetup;
