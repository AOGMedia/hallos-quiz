import { Swords, Coins } from "lucide-react";

interface InviterCardProps {
  nickname: string;
  avatarUrl: string;
  online: boolean;
  wagerAmount?: number;
  categoryName?: string | null;
  /** Hide the "join instantly" framing for expired/revoked links. */
  showMatchPromise?: boolean;
}

const InviterCard = ({
  nickname,
  avatarUrl,
  online,
  wagerAmount = 0,
  categoryName,
  showMatchPromise = true,
}: InviterCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-6 text-center animate-scale-in">
    <div className="relative inline-block">
      <img
        src={avatarUrl}
        alt={nickname}
        className="w-20 h-20 rounded-full border-2 border-primary bg-secondary"
      />
      {online && (
        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success border-2 border-card" />
      )}
    </div>

    <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-4">
      <span className="text-primary">{nickname}</span> invited you to play
    </h1>

    {showMatchPromise && (
      <p className="text-sm text-muted-foreground mt-1">
        {online
          ? `${nickname} is online now — join instantly!`
          : `${nickname} will challenge you once you're both online.`}
      </p>
    )}

    {(wagerAmount > 0 || categoryName) && (
      <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
        {categoryName && (
          <span className="badge-category flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" />
            {categoryName}
          </span>
        )}
        {wagerAmount > 0 && (
          <span className="badge-category flex items-center gap-1.5 text-primary">
            <Coins className="w-3.5 h-3.5" />
            {wagerAmount.toLocaleString()} MP
          </span>
        )}
      </div>
    )}
  </div>
);

export default InviterCard;
