import { useEffect } from "react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket/socket";
import { getToken } from "@/store/authStore";

interface QuizInviteClaimedPayload {
  inviteId: string;
  friendName: string;
  inviteeUserId: number;
  matched: boolean;
  matchId: string | null;
}

/**
 * Toasts the inviter when a friend claims their invite. Fires live if they're
 * online, or as a catch-up flush the next time they connect.
 *
 * Purely informational — nothing critical is gated on it, since sockets can be
 * missed and the server also emails the inviter.
 *
 * Self-contained on purpose: registers its own listener rather than editing the
 * existing AppLayout effect. `quiz_invite_claimed` is a new event name, so the
 * codebase-wide `socket.off(eventName)` pattern can't collide with it.
 */
const InviteNotifications = () => {
  useEffect(() => {
    // Never open a socket without a JWT — it caches the token at creation time
    // and there is no way to re-auth it afterwards.
    if (!getToken()) return;

    const socket = getSocket();
    const handler = ({ friendName, matched }: QuizInviteClaimedPayload) => {
      toast.success(
        matched
          ? `${friendName} joined — your match is ready!`
          : `${friendName} accepted your invite`
      );
    };

    socket.on("quiz_invite_claimed", handler);
    return () => { socket.off("quiz_invite_claimed", handler); };
  }, []);

  return null;
};

export default InviteNotifications;
