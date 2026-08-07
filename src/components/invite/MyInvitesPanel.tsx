import { useState } from "react";
import {
  Loader2, MousePointerClick, UserCheck, Ban, ChevronLeft, ChevronRight, Inbox,
} from "lucide-react";
import { useMyInvites, useRevokeInvite } from "@/hooks/useInvite";
import type { InviteStatus } from "@/lib/api/invite";

const STATUS_STYLES: Record<InviteStatus, string> = {
  active:  "bg-success/15 text-success border-success/30",
  claimed: "bg-primary/15 text-primary border-primary/30",
  expired: "bg-muted text-muted-foreground border-border",
  revoked: "bg-destructive/10 text-destructive border-destructive/30",
};

const MyInvitesPanel = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyInvites({ page, limit: 10 });
  const { mutate: revoke, isPending: revoking, variables: revokingId } = useRevokeInvite();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your invites…
      </div>
    );
  }

  const invites = data?.invites ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <Inbox className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No invites sent yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Share a link from the Share tab to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((inv) => (
        <div key={inv.id} className="bg-background border border-border rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-foreground truncate">
                {inv.toEmail ?? inv.toPhone ?? inv.inviteUrl}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {new Date(inv.createdAt).toLocaleDateString()} · {inv.channel}
                {inv.wagerAmount > 0 && ` · ${inv.wagerAmount.toLocaleString()} MP`}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${STATUS_STYLES[inv.status]}`}
            >
              {inv.status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" />
                {inv.clicksCount} {inv.clicksCount === 1 ? "click" : "clicks"}
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                {inv.claimsCount} joined
              </span>
            </div>

            {inv.status === "active" && (
              <button
                onClick={() => revoke(inv.id)}
                disabled={revoking && revokingId === inv.id}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Ban className="w-3 h-3" />
                {revoking && revokingId === inv.id ? "Cancelling…" : "Cancel"}
              </button>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyInvitesPanel;
