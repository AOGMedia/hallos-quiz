import { HelpCircle, Gamepad2, Compass, Smartphone, Wallet, ArrowRightLeft, Trophy, Zap, CheckCircle } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { MorganGuideBook } from "@/components/ui/3d-book-testimonial";

/**
 * Guide Page
 *
 * This page provides a comprehensive walkthrough of the quiz platform.
 * It's structured with lean, reusable sections and a mobile-first approach.
 */

const MORGAN_GUIDE_PAGES = [
  {
    title: "1. Navigation",
    subtitle: "Get around the Arena",
    text: "• Identity: Customize your avatar and view stats. \n• Lobby: Find players and create custom rooms. \n• Tournament: Compete in high-stakes scheduled events. \n• Wallet: Manage your points and track history.",
    icon: <Compass className="w-8 h-8 text-accent" />
  },
  {
    title: "2. How to Play",
    subtitle: "The Arena Gameplay",
    text: "• Pick a Challenge: Select a category and stake your MP. \n• Answer Rapidly: Speed and accuracy are vital! \n• Win Points: Beat your opponent to claim the total match prize pot.",
    icon: <Gamepad2 className="w-8 h-8 text-accent" />
  },
  {
    title: "3. Buying MP",
    subtitle: "Refill your reserves",
    text: "Navigate to 'Chuta Wallet' and click 'Purchase'. You can instantly transfer funds from your Hallos Wallet. Minimum purchase is 100 MP (₦1,400).",
    icon: <Wallet className="w-8 h-8 text-accent" />
  },
  {
    title: "4. Equivalence",
    subtitle: "True Market Value",
    text: "1 Morgan Point (MP) is pegged at ₦14. Your winnings are digital assets that can be cashed out back to your Hallos account immediately after a match.",
    icon: <ArrowRightLeft className="w-8 h-8 text-accent" />
  },
  {
    title: "5. Transactions",
    subtitle: "The Winner's Economy",
    text: "Matches are peer-to-peer. When you wager 100 MP, you're competing for a 200 MP pot. After the house commission, the winner takes it all!",
    icon: <Trophy className="w-8 h-8 text-accent" />
  }
];

const Guide = () => {
  const { userProfile } = useOutletContext<{ userProfile: { nickname: string } }>();

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <HelpCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Platform Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground">
          Welcome to the Arena, {userProfile?.nickname || "Challenger"}!
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          This guide will help you understand how to navigate Hallos Quiz and maximize your earnings.
        </p>
      </header>

      {/* Main Content Grid */}
      <div className="space-y-12 pb-12">
        {/* Interactive Morgan Point Guide (The Book) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           <div className="flex flex-col justify-start space-y-6">
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    {/* <Zap className="w-20 h-20 text-accent" /> */}
                    <img src="/icon.png" alt="Icon" className="w-20 h-20 text-accent"/> 
                 </div>
                 <h3 className="text-2xl font-black text-foreground mb-3 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-accent" /> The Arena Rulebook
                 </h3>
                 <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
                    Master every aspect of the Hallos Quiz Arena. From navigation to high-stakes 
                    wagering, this interactive guide covers everything you need to become a champion.
                 </p>
                 <div className="flex flex-wrap items-center gap-6 text-[10px] sm:text-xs font-bold text-accent uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> 1 MP = ₦14</span>
                    <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Instant Payouts</span>
                    <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Peer-to-Peer</span>
                 </div>
              </div>
              
              <div className="hidden lg:block p-4 border border-border rounded-xl bg-card/50 italic text-xs text-muted-foreground">
                 "Speed and accuracy aren't just traits—they're the currency of the arena. 
                 Enter prepared, leave rewarded."
                 Ensure a stable internet connection and a charged device before diving into the action. The arena waits for no one!
              </div>
           </div>
           
           <div className="flex justify-center items-start pt-2 overflow-hidden">
              <MorganGuideBook pages={MORGAN_GUIDE_PAGES} />
           </div>
        </div>
      </div>


      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-border">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <Smartphone className="w-4 h-4" />
          Optimized for all devices
        </div>
        {/* <div className="flex items-center gap-1.5 text-xs font-bold text-primary cursor-pointer hover:underline transition-all">
          Learn more about rules <ChevronRight className="w-4 h-4" />
        </div> */}
      </div>
    </div>
  );
};

export default Guide;
