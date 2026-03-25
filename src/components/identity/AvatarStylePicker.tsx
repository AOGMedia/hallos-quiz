import { DICEBEAR_STYLES, getAvatarUrl, type DiceBearStyle } from "@/lib/api/quizProfile";
import { LayoutGrid } from "lucide-react";

interface AvatarStylePickerProps {
  nickname: string;
  selectedStyle: DiceBearStyle;
  onSelect: (style: DiceBearStyle) => void;
  onBrowseMore?: () => void;
}

const AvatarStylePicker = ({ nickname, selectedStyle, onSelect, onBrowseMore }: AvatarStylePickerProps) => (
  <div>
    <p className="text-xs sm:text-sm text-muted-foreground mb-3">Choose your avatar style</p>
    <div className="flex flex-wrap gap-3">
      {DICEBEAR_STYLES.map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => onSelect(style)}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all ${
            selectedStyle === style
              ? "border-primary scale-105 shadow-lg shadow-primary/20"
              : "border-border hover:border-muted-foreground"
          }`}
          title={style}
        >
          <img
            src={getAvatarUrl(nickname || "preview", style)}
            alt={style}
            className="w-full h-full object-cover bg-secondary"
          />
        </button>
      ))}
    </div>
    <div className="flex items-center justify-between mt-2">
      <p className="text-[10px] sm:text-xs text-muted-foreground capitalize">
        Style: {selectedStyle}
      </p>
      {onBrowseMore && (
        <button
          type="button"
          onClick={onBrowseMore}
          className="flex items-center gap-1.5 text-[10px] sm:text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <LayoutGrid className="w-3 h-3" />
          Browse more avatars
        </button>
      )}
    </div>
  </div>
);

export default AvatarStylePicker;
