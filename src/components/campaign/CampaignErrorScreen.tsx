import { XCircle } from "lucide-react";

interface CampaignErrorScreenProps {
  message?: string;
}

const CampaignErrorScreen = ({ message }: CampaignErrorScreenProps) => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="max-w-sm w-full text-center space-y-4">
      <XCircle className="w-10 h-10 text-destructive mx-auto" />
      <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{message || "Please try again later."}</p>
    </div>
  </div>
);

export default CampaignErrorScreen;
