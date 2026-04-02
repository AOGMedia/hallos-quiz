import { AlertTriangle, X } from "lucide-react";

interface ForfeitModalProps {
  penaltyAmount: number;
  opponentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ForfeitModal = ({ penaltyAmount, opponentName, onConfirm, onCancel }: ForfeitModalProps) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 max-w-sm w-full animate-scale-in text-center">
      <button onClick={onCancel} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted">
        <X className="w-4 h-4" />
      </button>

      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-destructive" />
      </div>

      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Forfeit Match?</h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-5">
        Forfeiting gives <span className="text-primary font-medium">{opponentName}</span> the win.
        {penaltyAmount > 0 && (
          <> You will lose <span className="text-destructive font-semibold">{penaltyAmount.toLocaleString()} MP</span> as a penalty.</>
        )}
      </p>

      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-ghost flex-1 text-sm py-3">Keep Playing</button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold transition-colors"
        >
          Forfeit
        </button>
      </div>
    </div>
  </div>
);

export default ForfeitModal;
