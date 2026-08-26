import { Zap, BarChart2, Swords, User, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useIsContact } from "@/hooks/useChat";

interface LobbyPlayerCardProps {
  name: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
  isAI?: boolean;
  onChallenge: () => void;
  /** Real platform userId — only needed to power the optional Message button below. */
  userId?: number;
  /** Omit to render the card exactly as before (no Message button). */
  onMessage?: () => void;
}

const LobbyPlayerCard = ({
  name,
  avatar,
  points,
  wins,
  losses,
  isAI = false,
  onChallenge,
  userId,
  onMessage,
}: LobbyPlayerCardProps) => {
  const [imgError, setImgError] = useState(false);

  // Chat is scoped to prior contact (a match or invite together) — only
  // render the button once we know messaging them won't just 403.
  const { data: contactData } = useIsContact(onMessage ? userId : undefined);
  const canMessage = !!onMessage && !!contactData?.isContact;

  return (
    <div className="card-player flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-border bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
          {!imgError && avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <User className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-foreground truncate">{name}</span>
          {isAI && (
            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
              AI
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-warning flex-shrink-0" />
          <span className="text-muted-foreground">{points.toLocaleString()} Morgan Points</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BarChart2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">
            {wins} Wins / {losses} Losses
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <button onClick={onChallenge} className="btn-accent flex-1 flex items-center justify-center gap-2">
          <Swords className="w-4 h-4" />
          Challenge
        </button>
        {canMessage && (
          <button
            onClick={onMessage}
            aria-label={`Message ${name}`}
            className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-lg border border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default LobbyPlayerCard;
