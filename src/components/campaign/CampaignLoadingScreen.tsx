interface CampaignLoadingScreenProps {
  message?: string;
}

const CampaignLoadingScreen = ({ message = "Loading quiz…" }: CampaignLoadingScreenProps) => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

export default CampaignLoadingScreen;
