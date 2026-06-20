interface CampaignPendingScreenProps {
  expiresAt: string;
  starting: boolean;
  onStart: () => void;
}

const CampaignPendingScreen = ({ expiresAt, starting, onStart }: CampaignPendingScreenProps) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-gradient-radial from-primary/30 to-transparent blur-3xl pointer-events-none" />

    <div className="max-w-sm w-full space-y-6 relative">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">Hallos Campaign Quiz</h1>
        <p className="text-sm text-muted-foreground mt-1">Round 2 Selection Quiz</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">20</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">15s</p>
            <p className="text-xs text-muted-foreground">Per question</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">5min</p>
            <p className="text-xs text-muted-foreground">Total max</p>
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-1.5 text-xs text-muted-foreground">
          <p>• No feedback during the quiz — results only at the end</p>
          <p>• Timer starts immediately and cannot be paused</p>
          <p>• Results will be sent to your registered email</p>
        </div>

        {expiresAt && (
          <p className="text-xs text-center text-muted-foreground/70">
            Link valid until {new Date(expiresAt).toLocaleString()}
          </p>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={starting}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {starting ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            Starting…
          </>
        ) : (
          "Start Quiz"
        )}
      </button>
    </div>
  </div>
);

export default CampaignPendingScreen;
