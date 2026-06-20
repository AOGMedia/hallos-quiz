import { AlertTriangle } from "lucide-react";

const CampaignNotLoggedIn = () => (
  <div className="min-h-screen bg-background flex items-center justify-center px-4">
    <div className="max-w-sm w-full text-center space-y-4">
      <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto" />
      <h1 className="text-lg font-semibold text-foreground">Session expired</h1>
      <p className="text-sm text-muted-foreground">
        Please use the quiz link from your email to access this quiz.
      </p>
      <a
        href="https://www.hallos.net/dashboard/games"
        className="inline-block mt-2 text-sm text-primary underline"
      >
        Go to Hallos
      </a>
    </div>
  </div>
);

export default CampaignNotLoggedIn;
