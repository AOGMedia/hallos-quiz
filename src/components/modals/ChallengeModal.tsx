import { useState } from "react";
import { X, Swords, Zap, Search, Plus } from "lucide-react";
import { categories } from "@/data/gameData";

interface ChallengeModalProps {
  player: {
    name: string;
    avatar: string;
    points: number;
    form: ("W" | "L" | "D")[];
  };
  onClose: () => void;
  onChallenge: (selectedCategories: string[]) => void;
}

const ChallengeModal = ({ player, onClose, onChallenge }: ChallengeModalProps) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [wagerEnabled, setWagerEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFormColor = (result: "W" | "L" | "D") => {
    switch (result) {
      case "W":
        return "form-win";
      case "L":
        return "form-loss";
      case "D":
        return "form-draw";
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
            <h2 className="text-lg sm:text-xl font-bold">Challenge Mode</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Player preview label */}
        <p className="text-center text-muted-foreground mb-3 sm:mb-4 flex items-center justify-center gap-2 text-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Player Preview
        </p>

        {/* Player info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-border"
            />
            <div>
              <h3 className="text-base sm:text-xl font-semibold">{player.name}</h3>
              <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-base">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-warning" />
                <span>{player.points.toLocaleString()} Zeta Points</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="flex items-center gap-2 text-muted-foreground mb-1 sm:mb-2 text-xs sm:text-base">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Form
            </div>
            <div className="flex gap-1">
              {player.form.map((result, i) => (
                <span key={i} className={getFormColor(result)}>
                  {result}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Category selection */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 sm:gap-0">
            <div>
              <h4 className="font-semibold text-sm sm:text-base">Select quiz categories</h4>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Select up to five
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search categories"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-dark pl-10 py-2 text-sm w-full sm:w-56"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {filteredCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all ${
                  selectedCategories.includes(cat)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-primary/50 text-primary hover:bg-primary/10"
                }`}
              >
                <Plus className="w-3 h-3" />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Wager toggle */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-secondary rounded-xl mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
            <span className="font-medium text-sm sm:text-base">Wager Zeta</span>
          </div>
          <button
            onClick={() => setWagerEnabled(!wagerEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              wagerEnabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-foreground transition-transform duration-200 ${
                wagerEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Challenge button */}
        <button
          onClick={() => onChallenge(selectedCategories)}
          disabled={selectedCategories.length === 0}
          className={`btn-primary w-full text-base sm:text-lg py-3 sm:py-4 flex items-center justify-center gap-2 ${
            selectedCategories.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
          Challenge Player
        </button>
      </div>
    </div>
  );
};

export default ChallengeModal;
