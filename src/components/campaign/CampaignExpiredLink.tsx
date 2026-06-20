import { Clock } from "lucide-react";

const CampaignExpiredLink = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="max-w-sm w-full text-center space-y-4">
      <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
      <h1 className="text-lg font-semibold text-foreground">Link expired</h1>
      <p className="text-sm text-muted-foreground">
        This quiz link has expired. Quiz links are valid for 72 hours.
      </p>
    </div>
  </div>
);

export default CampaignExpiredLink;
