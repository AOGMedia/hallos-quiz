import { ChevronLeft, ChevronRight, Zap, Trophy, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tournamentHistory, type TournamentFormat } from "@/data/tournamentData";
import { useState } from "react";

interface TournamentHistoryProps {
  onBack: () => void;
}

const formatColors: Record<TournamentFormat, string> = {
  "Battle Royale": "bg-red-500/20 text-red-400 border border-red-500/30",
  "Speed Run": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  "Knockout": "bg-muted text-foreground border border-border",
  "Classic": "bg-green-500/20 text-green-400 border border-green-500/30",
};

const TournamentHistory = ({ onBack }: TournamentHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 4;
  const totalMatches = 156;
  const itemsPerPage = 6;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="bg-card border-border hover:bg-muted rounded-full w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">My History</h1>
          <p className="text-xs sm:text-base text-muted-foreground">Overview of your tournament performance and earnings</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Win Rate */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2 sm:mb-4">
            <span className="text-muted-foreground text-xs sm:text-sm">Win Rate</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-accent/20 flex items-center justify-center">
              <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-4xl font-bold text-foreground">68.4%</span>
            <span className="text-xs sm:text-sm text-green-400">+2.4%</span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">Top 5 finishes in last 10 games</p>
        </div>

        {/* Total ZP Earned */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2 sm:mb-4">
            <span className="text-muted-foreground text-xs sm:text-sm">Total ZP Earned</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-4xl font-bold text-foreground">12,380</span>
            <span className="text-xs sm:text-sm text-muted-foreground">≈ $123.80</span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">Lifetime earnings from 56 events</p>
        </div>

        {/* Tournaments Played */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2 sm:mb-4">
            <span className="text-muted-foreground text-xs sm:text-sm">Tournaments Played</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-4xl font-bold text-foreground">156</span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">Across 4 different quiz format</p>
        </div>
      </div>

      {/* Recent Activities Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Recent Activities</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">
                <th className="text-left p-2 sm:p-4">Date</th>
                <th className="text-left p-2 sm:p-4">Tournament Name</th>
                <th className="text-left p-2 sm:p-4">Format</th>
                <th className="text-left p-2 sm:p-4">Entry</th>
                <th className="text-left p-2 sm:p-4">Result</th>
                <th className="text-right p-2 sm:p-4">ZP Won/Lost</th>
              </tr>
            </thead>
            <tbody>
              {tournamentHistory.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                  <td className="p-2 sm:p-4 text-muted-foreground text-xs sm:text-base whitespace-nowrap">{item.date}</td>
                  <td className="p-2 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
                        {item.icon}
                      </div>
                      <span className="font-medium text-foreground text-xs sm:text-base">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-2 sm:p-4">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded whitespace-nowrap ${formatColors[item.format]}`}>
                      {item.format}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4 text-foreground text-xs sm:text-base whitespace-nowrap">{item.entry} ZP</td>
                  <td className="p-2 sm:p-4">
                    <span className={`text-xs sm:text-base whitespace-nowrap ${item.result.includes("1st") || item.result.includes("2nd") 
                      ? "text-accent" 
                      : "text-foreground"
                    }`}>
                      {item.result}
                    </span>
                  </td>
                  <td className="p-2 sm:p-4 text-right">
                    <span className={`text-xs sm:text-base whitespace-nowrap ${item.zpWonLost > 0 ? "text-green-400" : "text-red-400"}`}>
                      {item.zpWonLost > 0 ? "+" : ""}{item.zpWonLost} ZP
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-3 sm:p-4 border-t border-border">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Showing {itemsPerPage} of {totalMatches} matches
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-card border-border"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            {[1, 2, 3, 4].map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm ${currentPage === page 
                  ? "bg-accent text-accent-foreground" 
                  : "bg-card border-border"
                }`}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-card border-border"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentHistory;
