import { useState } from "react";
import { History, Plus, Zap, Swords, Timer, Crown, GraduationCap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { featuredTournament, tournaments, type TournamentFormat } from "@/data/tournamentData";
import tournamentBg from "@/assets/tournament-bg.png";

type FilterFormat = "All Formats" | TournamentFormat;

interface TournamentArenaProps {
  onHistoryClick: () => void;
  onHostClick: () => void;
}

const formatColors: Record<TournamentFormat, string> = {
  "Battle Royale": "bg-red-500/20 text-red-400 border border-red-500/30",
  "Speed Run": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  "Knockout": "bg-muted text-foreground border border-border",
  "Classic": "bg-green-500/20 text-green-400 border border-green-500/30",
};

const TournamentArena = ({ onHistoryClick, onHostClick }: TournamentArenaProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterFormat>("All Formats");
  const [sortBy, setSortBy] = useState("Starting Soon");

  const filters: FilterFormat[] = ["All Formats", "Battle Royale", "Speed Run", "Knockout", "Classic"];

  const filteredTournaments = activeFilter === "All Formats"
    ? tournaments
    : tournaments.filter(t => t.format === activeFilter);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">Tournament Arena</h1>
          <p className="text-xs sm:text-base text-muted-foreground">Compete for Zeta points (ZP) and exchange your winnings for real rewards</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onHistoryClick}
            className="bg-card border-border hover:bg-muted flex-1 sm:flex-none text-xs sm:text-sm"
            size="sm"
          >
            <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            History
          </Button>
          <Button
            onClick={onHostClick}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none text-xs sm:text-sm"
            size="sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>

      {/* Featured Event */}
      <div
        className="relative rounded-xl overflow-hidden mb-6 sm:mb-8 p-4 sm:p-6"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--background)) 40%, transparent 100%), url(${tournamentBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Trophy Icon */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl sm:text-4xl flex-shrink-0">
              🏆
            </div>
            
            <div className="flex flex-col">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
                <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-muted border border-border rounded">
                  FEATURED EVENT
                </span>
                <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                  LIVE IN {featuredTournament.liveIn}
                </span>
              </div>
              
              {/* Title */}
              <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">{featuredTournament.name}</h2>
              <p className="text-xs sm:text-base text-muted-foreground max-w-lg mb-3 sm:mb-4">{featuredTournament.description}</p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 sm:gap-8">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">PRIZE POOL</p>
                  <p className="text-sm sm:text-lg font-bold text-yellow-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    {featuredTournament.prizePool.toLocaleString()} ZP
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">ENTRY FEE</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">{featuredTournament.entry} ZP</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">FORMAT</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">{featuredTournament.format}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Join Button */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 sm:px-8 text-sm flex-1 lg:flex-none">
              Join Now →
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {featuredTournament.quota.current}/{featuredTournament.quota.max} Registered
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${activeFilter === filter 
                ? "bg-accent text-accent-foreground" 
                : "bg-card border-border hover:bg-muted"
              }`}
            >
              {filter === "Battle Royale" && <Swords className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              {filter === "Speed Run" && <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              {filter === "Knockout" && <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              {filter === "Classic" && <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              <span className="hidden sm:inline">{filter}</span>
              <span className="sm:hidden">{filter === "All Formats" ? "All" : filter.split(" ")[0]}</span>
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">Sort by:</span>
          <Button variant="outline" size="sm" className="bg-card border-border text-xs sm:text-sm">
            {sortBy}
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
          </Button>
        </div>
      </div>

      {/* Tournament Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">
                <th className="text-left p-2 sm:p-4">Tournament Name</th>
                <th className="text-left p-2 sm:p-4">Format</th>
                <th className="text-left p-2 sm:p-4">Entry</th>
                <th className="text-left p-2 sm:p-4">Prize Pool</th>
                <th className="text-left p-2 sm:p-4">Quota</th>
                <th className="text-left p-2 sm:p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTournaments.map((tournament) => (
                <tr key={tournament.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
                        {tournament.icon}
                      </div>
                      <span className="font-medium text-foreground text-xs sm:text-base">{tournament.name}</span>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded whitespace-nowrap ${formatColors[tournament.format]}`}>
                      {tournament.format}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4 text-foreground text-xs sm:text-base whitespace-nowrap">{tournament.entry} ZP</td>
                  <td className="p-2 sm:p-4">
                    <span className="text-yellow-400 flex items-center gap-1 text-xs sm:text-base whitespace-nowrap">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                      {tournament.prizePool.toLocaleString()} ZP
                    </span>
                  </td>
                  <td className="p-2 sm:p-4 text-foreground text-xs sm:text-base whitespace-nowrap">{tournament.quota.current}/{tournament.quota.max}</td>
                  <td className="p-2 sm:p-4">
                    {tournament.quota.current >= tournament.quota.max ? (
                      <Button variant="outline" size="sm" disabled className="bg-muted text-muted-foreground border-border text-xs">
                        Full
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs">
                        Register
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Load More */}
        <div className="flex justify-center p-3 sm:p-4 border-t border-border">
          <button className="flex items-center gap-2 text-xs sm:text-base text-muted-foreground hover:text-foreground transition-colors">
            Load more tournaments
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TournamentArena;
