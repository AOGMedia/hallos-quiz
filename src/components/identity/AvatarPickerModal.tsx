import { useState, useMemo } from "react";
import { X, Check } from "lucide-react";
import { DICEBEAR_STYLES, getAvatarUrl, type DiceBearStyle } from "@/lib/api/quizProfile";

// Varied seeds so each slot looks distinct
const SEEDS = [
  "Felix", "Aneka", "Zara", "Koda", "Milo", "Luna",
  "Blaze", "Nova", "Riku", "Sage", "Orion", "Ivy",
  "Titan", "Echo", "Pixel", "Storm", "Ash", "Ember",
  "Frost", "Vex", "Nyx", "Cleo", "Dusk", "Wren",
];

interface AvatarPickerModalProps {
  nickname: string;
  selectedStyle: DiceBearStyle;
  onSelect: (style: DiceBearStyle, seed: string) => void;
  onClose: () => void;
}

const AvatarPickerModal = ({ nickname, selectedStyle, onSelect, onClose }: AvatarPickerModalProps) => {
  const [activeStyle, setActiveStyle] = useState<DiceBearStyle>(selectedStyle);
  const [activeSeed, setActiveSeed] = useState<string>(nickname || SEEDS[0]);

  // Use nickname as first seed so the user's own avatar appears first
  const seeds = useMemo(() => {
    const base = nickname ? [nickname, ...SEEDS.filter((s) => s !== nickname)] : SEEDS;
    return base.slice(0, 24);
  }, [nickname]);

  const handleConfirm = () => {
    onSelect(activeStyle, activeSeed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#1a2030] border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Browse Avatars</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Style tabs */}
        <div className="flex gap-1.5 px-5 py-3 overflow-x-auto scrollbar-hide border-b border-border flex-shrink-0">
          {DICEBEAR_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setActiveStyle(style)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                activeStyle === style
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {style}
            </button>
          ))}
        </div>

        {/* Avatar grid */}
        <div className="overflow-y-auto p-4 flex-1">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {seeds.map((seed) => {
              const url = getAvatarUrl(seed, activeStyle);
              const isSelected = activeSeed === seed && activeStyle === activeStyle;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setActiveSeed(seed)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    activeSeed === seed
                      ? "border-primary scale-105 shadow-lg shadow-primary/20"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img
                    src={url}
                    alt={seed}
                    className="w-full h-full object-cover bg-secondary"
                    loading="lazy"
                  />
                  {activeSeed === seed && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview + confirm */}
        <div className="flex items-center gap-4 px-5 py-4 border-t border-border flex-shrink-0">
          <img
            src={getAvatarUrl(activeSeed, activeStyle)}
            alt="selected"
            className="w-12 h-12 rounded-full border-2 border-primary bg-secondary flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Selected</p>
            <p className="text-sm font-medium text-foreground capitalize truncate">
              {activeStyle} · {activeSeed}
            </p>
          </div>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors flex-shrink-0"
          >
            Use this
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
