import { useState } from "react";
import { ArrowLeft, Users, Swords, BookOpen, Play, Zap } from "lucide-react";
import AahbibiLogo from "@/components/icons/AahbibiLogo";
import OnboardingSlide from "@/components/onboarding/OnboardingSlide";
import FeatureCard from "@/components/onboarding/FeatureCard";
import PlayerCard from "@/components/onboarding/PlayerCard";
import CategoryBadge from "@/components/onboarding/CategoryBadge";
import ExitConfirmModal from "@/components/modals/ExitConfirmModal";
import { categories, mockPlayers } from "@/data/gameData";

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["General Knowledge", "Economics", "History"]);
  const [showExitModal, setShowExitModal] = useState(false);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const displayedPlayers = mockPlayers.slice(0, 6);

  // Preview player data for first screen
  const previewPlayers = [
    { name: "MidnightBolt", points: 1300, wins: 15, losses: 2 },
    { name: "BrainBlitz", points: 1300, wins: 15, losses: 2 },
    { name: "QuizWhizX", points: 1300, wins: 15, losses: 2 },
    { name: "TriviaNova", points: 1300, wins: 15, losses: 2 },
    { name: "FactHacker", points: 1300, wins: 15, losses: 2, isOnline: true },
    { name: "SmartyPulse", points: 1300, wins: 15, losses: 2 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 glow-top pointer-events-none" />
      
      {/* Exit button - fixed positioning for mobile */}
      <button 
        onClick={() => setShowExitModal(true)}
        className="btn-exit fixed sm:absolute top-4 left-4 sm:top-6 sm:left-6 z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">EXIT</span>
      </button>

      {/* Scrollable container */}
      <div className="min-h-screen overflow-y-auto pb-8 sm:pb-16">
        {/* Header */}
        <header className="pt-16 sm:pt-12 pb-4 sm:pb-8 text-center px-4">
          <AahbibiLogo className="h-8 sm:h-10 justify-center mx-auto mb-2" />
          <p className="text-muted-foreground text-sm sm:text-base">Welcome to the Game Hub.</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-4 sm:mt-6">
            {step === 0 && "Play. Learn. Win"}
            {step === 1 && "Challenge players in topics you love"}
            {step === 2 && "Master the Challenge"}
            {step === 3 && "Turn your knowledge into Capital"}
            {step === 4 && "Every game makes you smarter"}
          </h1>
        </header>

        {/* Content */}
        <main className="container px-4 sm:px-6">
          {step === 0 && (
            <OnboardingSlide
              title="Play. Learn. Win"
              description="Master new skills through competitive challenges and earn amazing rewards while you learn."
              buttonText="Get Started"
              onButtonClick={handleNext}
              currentStep={step}
              totalSteps={5}
              showSkip={false}
            >
              {/* Preview cards - Challenge modal + Question + Player grid */}
              <div className="relative mt-4 lg:mt-0">
                {/* Main Challenge card with question preview */}
                <div className="bg-card border border-border rounded-xl p-4 w-full max-w-[280px] mx-auto lg:mx-0 mb-4 lg:mb-0 lg:absolute lg:left-0 lg:top-8 z-10">
                  <h3 className="font-semibold mb-4 text-sm">Challenge</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <img src={mockPlayers[0].avatar} className="w-8 h-8 rounded-full" alt="" />
                    <div>
                      <span className="font-medium text-sm">BrainBlitz</span>
                      <p className="text-xs text-muted-foreground">1300 Zeta Points</p>
                    </div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-muted-foreground mb-3 text-xs">What is the name...</p>
                    <div className="space-y-2">
                      <div className="bg-muted rounded px-3 py-2 text-xs">A. Vibranium</div>
                      <div className="bg-muted rounded px-3 py-2 text-xs">C. Carbonadium</div>
                    </div>
                  </div>
                </div>
                
                {/* Player cards grid */}
                <div className="lg:ml-[200px] grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {previewPlayers.map((player, i) => (
                    <div 
                      key={i} 
                      className="card-player p-3 animate-slide-in" 
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative">
                          <img 
                            src={mockPlayers[i % mockPlayers.length].avatar} 
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full" 
                            alt="" 
                          />
                          {player.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-card" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium truncate">{player.name}</span>
                      </div>
                      <div className="space-y-1 mb-2">
                        <p className="text-[10px] sm:text-xs text-warning flex items-center gap-1">
                          <Zap className="w-3 h-3" /> {player.points} Zeta Points
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          ⊘ {player.wins} Wins / {player.losses} Losses
                        </p>
                      </div>
                      <button className="btn-accent text-[10px] sm:text-xs w-full py-1.5 rounded-lg">
                        <Swords className="w-3 h-3 inline mr-1" /> Challenge
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </OnboardingSlide>
          )}

          {step === 1 && (
            <OnboardingSlide
              title="Challenge players in topics you love"
              description="Join thousands of players in real-time battles. Choose your specialty and climb the leader board to earn prizes"
              buttonText="Next"
              onButtonClick={handleNext}
              onSkip={handleSkip}
              currentStep={step}
              totalSteps={5}
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Categories */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {categories.slice(0, 9).map((cat) => (
                    <CategoryBadge
                      key={cat}
                      name={cat}
                      isSelected={selectedCategories.includes(cat)}
                      onClick={() => toggleCategory(cat)}
                    />
                  ))}
                </div>

                {/* Online count */}
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">13,078 players online</span>
                </div>

                {/* Player cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {displayedPlayers.slice(0, 3).map((player) => (
                    <PlayerCard key={player.id} {...player} />
                  ))}
                </div>
              </div>
            </OnboardingSlide>
          )}

          {step === 2 && (
            <OnboardingSlide
              title="Master the Challenge"
              description="Four simple steps to prove your knowledge and rise to the top of the leaderboard:"
              bulletPoints={[
                "Challenge opponent",
                "Select topics",
                "Challenge acceptance",
                "PLAY",
              ]}
              buttonText="Next"
              onButtonClick={handleNext}
              onSkip={handleSkip}
              currentStep={step}
              totalSteps={5}
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <FeatureCard
                    icon={Users}
                    title="Challenge an Opponent"
                    description="Select an opponent from the lobby to enter battle with or choose to practice with aahbibi AI bots."
                    isActive
                  />
                  <FeatureCard
                    icon={BookOpen}
                    title="Select Topics"
                    description="Select your favourite subjects or allow our AI surprise you with random picks."
                  />
                  <FeatureCard
                    icon={Swords}
                    title="Wait for an acceptance"
                    description="What's a fair game without consent? Send the request and wait for your opponent to accept the challenge."
                  />
                </div>

                <div className="flex justify-center">
                  <button className="btn-ghost flex items-center gap-2 opacity-50 cursor-not-allowed text-sm sm:text-base">
                    Play <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </OnboardingSlide>
          )}

          {step === 3 && (
            <OnboardingSlide
              title="Turn your knowledge into Capital"
              description="Every game won earns you points. Here's how they turn into real world rewards that you can spend:"
              buttonText="Next"
              onButtonClick={handleNext}
              onSkip={handleSkip}
              currentStep={step}
              totalSteps={5}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <FeatureCard
                  icon={Users}
                  title="Challenge an Opponent"
                  description="Select an opponent from the lobby to enter battle with or choose to practice with aahbibi AI bots."
                />
                <FeatureCard
                  icon={BookOpen}
                  title="Select Topics"
                  description="Select your favourite subjects or allow our AI surprise you with random picks."
                />
                <FeatureCard
                  icon={Swords}
                  title="Wait for an acceptance"
                  description="What's a fair game without consent? Send the request and wait for your opponent to accept the challenge."
                />
              </div>
            </OnboardingSlide>
          )}

          {step === 4 && (
            <OnboardingSlide
              title="Every game makes you smarter"
              description="Track your progress, climb the ranks, and sharpen your skills with every challenge. Competition meets education in our global game hub."
              buttonText="Let's Go"
              onButtonClick={handleNext}
              onSkip={handleSkip}
              currentStep={step}
              totalSteps={5}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <FeatureCard
                  icon={Users}
                  title="Challenge an Opponent"
                  description="Select an opponent from the lobby to enter battle with or choose to practice with aahbibi AI bots."
                />
                <FeatureCard
                  icon={BookOpen}
                  title="Select Topics"
                  description="Select your favourite subjects or allow our AI surprise you with random picks."
                />
                <FeatureCard
                  icon={Swords}
                  title="Wait for an acceptance"
                  description="What's a fair game without consent? Send the request and wait for your opponent to accept the challenge."
                />
              </div>
            </OnboardingSlide>
          )}
        </main>

        {/* Decorative dots */}
        <div className="hidden sm:flex absolute bottom-0 left-0 right-0 h-32 items-end justify-center pointer-events-none">
          <div className="flex gap-2 opacity-30">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground" />
            ))}
          </div>
        </div>
      </div>

      {/* Exit Modal */}
      {showExitModal && (
        <ExitConfirmModal
          onClose={() => setShowExitModal(false)}
          onConfirm={() => {
            setShowExitModal(false);
            window.location.href = 'https://www.hallos.net/dashboard';
          }}
        />
      )}
    </div>
  );
};

export default Onboarding;
