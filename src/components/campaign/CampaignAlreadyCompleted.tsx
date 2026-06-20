import { CheckCircle } from "lucide-react";

const CampaignAlreadyCompleted = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="max-w-sm w-full text-center space-y-4">
      <CheckCircle className="w-10 h-10 text-success mx-auto" />
      <h1 className="text-lg font-semibold text-foreground">Already completed</h1>
      <p className="text-sm text-muted-foreground">
        You have already completed this quiz. Check your email for your results.
      </p>
    </div>
  </div>
);

export default CampaignAlreadyCompleted;
