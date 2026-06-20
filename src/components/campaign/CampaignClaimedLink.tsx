import { XCircle } from "lucide-react";

const CampaignClaimedLink = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="max-w-sm w-full text-center space-y-4">
      <XCircle className="w-10 h-10 text-destructive mx-auto" />
      <h1 className="text-lg font-semibold text-foreground">Link already claimed</h1>
      <p className="text-sm text-muted-foreground">
        This quiz link has already been claimed by another account.
      </p>
    </div>
  </div>
);

export default CampaignClaimedLink;
