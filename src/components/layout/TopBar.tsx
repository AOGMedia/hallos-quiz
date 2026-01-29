import { Search, Zap, Bell } from "lucide-react";

interface TopBarProps {
  onlineCount: number;
  zetaPoints: number;
  wins: number;
  totalGames: number;
  userAvatar: string;
}

const TopBar = ({ onlineCount, zetaPoints, wins, totalGames, userAvatar }: TopBarProps) => {
  return (
    <header className="min-h-[56px] md:h-16 border-b border-border bg-background flex flex-col md:flex-row items-stretch md:items-center justify-between px-4 md:px-6 py-2 md:py-0 gap-2 md:gap-0">
      {/* Search - hidden on mobile, visible from md up */}
      <div className="hidden md:block relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search players"
          className="input-dark w-full pl-10 py-2 text-sm"
        />
      </div>

      {/* Stats - scrollable on mobile */}
      <div className="flex items-center gap-3 md:gap-6 overflow-x-auto pl-12 md:pl-0 scrollbar-hide">
        {/* Online players */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
            <span className="hidden sm:inline">{onlineCount.toLocaleString()} players online</span>
            <span className="sm:hidden">{(onlineCount / 1000).toFixed(1)}k online</span>
          </span>
        </div>

        {/* Zeta points */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-xs md:text-sm text-foreground hidden sm:inline">Zeta points</span>
          <span className="text-xs md:text-sm font-semibold text-foreground">{zetaPoints.toLocaleString()}</span>
        </div>

        {/* Win rate */}
        <div className="flex items-center gap-2 bg-secondary px-2 md:px-3 py-1 md:py-1.5 rounded-lg shrink-0">
          <span className="text-xs md:text-sm text-foreground">{wins}/{totalGames} wins</span>
          <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-warning flex items-center justify-center">
            <Trophy className="w-3 h-3 md:w-4 md:h-4 text-warning-foreground" />
          </div>
        </div>

        {/* Avatar */}
        <img src={userAvatar} alt="User" className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-border shrink-0" />

        {/* Notifications */}
        <button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted shrink-0">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export default TopBar;
