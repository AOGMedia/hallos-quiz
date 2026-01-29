import { AlertCircle, X } from "lucide-react";

interface ExitConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const ExitConfirmModal = ({ onClose, onConfirm }: ExitConfirmModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-3xl p-8 sm:p-12 max-w-md w-full mx-4 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Warning Icon */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary flex items-center justify-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" strokeWidth={1.5} />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6 sm:mb-8">Exit the Game Hub?</h2>

        {/* Buttons */}
        <div className="flex gap-3 sm:gap-4 justify-center">
          <button
            onClick={onClose}
            className="px-8 sm:px-12 py-3 sm:py-4 rounded-full bg-card border border-border hover:bg-muted text-foreground text-base sm:text-lg font-medium transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-8 sm:px-12 py-3 sm:py-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg font-medium transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
