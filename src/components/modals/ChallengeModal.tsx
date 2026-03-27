import { useState } from "react";
import { X, Swords, Zap, Search, AlertCircle, Loader2 } from "lucide-react";
import { useCategories } from "@/hooks/useChallenge";
import type { QuizCategory } from "@/lib/api/lobby";

interface ChallengeModalProps {
  player: {
    name: string;
    avatar: string;
    points: number;
    form: ("W" | "L" | "D")[];
  };
  onClose: () => void;
  onChallenge: (payload: {
    categoryId: string;
    categoryName: string;
    wagerAmount: number;
  }) => void;
}

const WAGER_PRESETS = [50, 100, 200, 500];
const MIN_WAGER = 10;

const getFormColor = (result: "W" | "L" | "D") => {
  switch (result) {
    case "W": return "form-win";
    case "L": return "form-loss";
    case "D": return "form-draw";
  }
};

const ChallengeModal = ({ player, onClose, onChallenge }: ChallengeModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory | null>(null);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [customWager, setCustomWager] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categoriesData, isLoading: loadingCategories } = useCategories();
  const allCategories = categoriesData?.categories ?? [];

  const toggleCategory = (cat: QuizCategory) => {
    setSelectedCategory((prev) => prev?.id === cat.id ? null : cat);
  };

  const effectiveWager = customWager ? parseInt(customWager) || 0 : wagerAmount;
  const filteredCategories = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canChallenge = selectedCategory !== null && effectiveWager >= MIN_WAGER;

  const handleChallenge = () => {
    if (!canChallenge || !selectedCategory) return;
    onChallenge({ categoryId: selectedCategory.id, categoryName: selectedCategory.name, wagerAmount: effectiveWager });
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
          <button onClick={onClose} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Player info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={player.avatar} alt={player.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-border" />
            <div>
              <h3 className="text-base sm:text-xl font-semibold">{player.name}</h3>
              <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-warning" />
                <span>{player.points.toLocaleString()} Chuta Points</span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground mb-1">Form</p>
            <div className="flex gap-1">
              {player.form.map((r, i) => (
                <span key={i} className={getFormColor(r)}>{r}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Category selection */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <h4 className="font-semibold text-sm sm:text-base">Select quiz category</h4>
              <p className="text-xs text-muted-foreground">Pick 1 category for this challenge</p>
            </div>            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search categories"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-dark pl-10 py-2 text-sm w-full sm:w-52"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading categories...
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border transition-all ${
                    selectedCategory?.id === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-primary/50 text-primary hover:bg-primary/10"
                  }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Wager — always required */}
        <div className="mb-5 sm:mb-6 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-warning" />
              <h4 className="font-semibold text-sm sm:text-base">Wager Amount</h4>
              <span className="text-[10px] sm:text-xs text-muted-foreground">(required · min {MIN_WAGER} CP)</span>
            </div>

            {/* Preset chips */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {WAGER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => { setWagerAmount(preset); setCustomWager(""); }}
                  className={`py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                    wagerAmount === preset && !customWager
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {preset} CP
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warning pointer-events-none" />
              <input
                type="number"
                value={customWager}
                onChange={(e) => setCustomWager(e.target.value)}
                placeholder="Or enter custom amount (CP)"
                min={MIN_WAGER}
                className="input-dark w-full pl-9 text-sm"
              />
            </div>
          </div>

          {/* Escrow notice */}
          {effectiveWager >= MIN_WAGER && (
            <div className="flex items-center gap-2 p-2.5 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                <span className="font-semibold">{effectiveWager.toLocaleString()} CP</span> held in escrow — winner takes all
              </span>
            </div>
          )}

          {customWager && effectiveWager < MIN_WAGER && (
            <p className="text-xs text-destructive">Minimum wager is {MIN_WAGER} CP</p>
          )}
        </div>

        {/* Challenge button */}
        <button
          onClick={handleChallenge}
          disabled={!canChallenge}
          className={`btn-primary w-full text-base sm:text-lg py-3 sm:py-4 flex items-center justify-center gap-2 ${
            !canChallenge ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
          {selectedCategory === null
            ? "Select a category"
            : effectiveWager < MIN_WAGER
            ? "Enter a wager amount"
            : `Challenge · ${effectiveWager.toLocaleString()} CP`}
        </button>
      </div>
    </div>
  );
};

export default ChallengeModal;
