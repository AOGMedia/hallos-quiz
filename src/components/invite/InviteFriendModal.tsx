import { useState, useEffect, useCallback } from "react";
import {
  X, UserPlus, MessageCircle, Smartphone, Copy, Check,
  ChevronDown, Loader2, AlertCircle, Search, RefreshCw,
} from "lucide-react";
import { useCreateInvite } from "@/hooks/useInvite";
import { useCategories } from "@/hooks/useChallenge";
import MyInvitesPanel from "./MyInvitesPanel";
import type { QuizCategory } from "@/lib/api/lobby";
import type { CreateInviteResponse } from "@/lib/api/invite";

const WAGER_PRESETS = [0, 50, 100, 200, 500];

interface InviteFriendModalProps {
  onClose: () => void;
}

const InviteFriendModal = ({ onClose }: InviteFriendModalProps) => {
  const [tab, setTab] = useState<"share" | "sent">("share");
  const [showWager, setShowWager] = useState(false);
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [wagerAmount, setWagerAmount] = useState(0);
  const [customWager, setCustomWager] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState<CreateInviteResponse | null>(null);

  const { mutate: create, isPending, isError, error, reset } = useCreateInvite();
  const { data: categoriesData, isLoading: loadingCategories } = useCategories();
  const allCategories = categoriesData?.categories ?? [];

  const effectiveWager = customWager !== "" ? parseInt(customWager) || 0 : wagerAmount;

  // A wagered invite can only auto-match if it also carries a category.
  const isWagered = showWager && effectiveWager > 0 && !!category;

  const generate = useCallback(() => {
    reset();
    setCopied(false);
    create(
      isWagered
        ? { channel: "link", wagerAmount: effectiveWager, categoryId: category!.id }
        : { channel: "link" },
      { onSuccess: setInvite }
    );
  }, [create, reset, isWagered, effectiveWager, category]);

  // Create a plain link as soon as the modal opens.
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the input below is selectable as a fallback.
    }
  };

  const filteredCategories = allCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Terms changed since the current link was minted — needs regenerating.
  const termsChanged =
    !!invite &&
    (invite.invite.wagerAmount !== (isWagered ? effectiveWager : 0) ||
      (invite.invite.categoryId ?? null) !== (isWagered ? category!.id : null));

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-lg w-full animate-scale-in max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold">Invite a friend</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-muted"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5">
          {(["share", "sent"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                tab === t
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t === "share" ? "Share" : "My invites"}
            </button>
          ))}
        </div>

        {tab === "sent" ? (
          <MyInvitesPanel />
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Send a link to anyone — they don't need an account yet. You'll be notified
              the moment they join.
            </p>

            {/* Optional wager */}
            <div className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowWager((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <span>Add a wager <span className="text-muted-foreground">(optional)</span></span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showWager ? "rotate-180" : ""}`}
                />
              </button>

              {showWager && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">
                    Pick a category and stake to have the match start automatically the
                    moment your friend joins.
                  </p>

                  {/* Category */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories"
                        className="input-dark w-full pl-9 text-sm"
                      />
                    </div>
                    {loadingCategories ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading categories…
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {filteredCategories.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setCategory(category?.id === c.id ? null : c)}
                            className={
                              category?.id === c.id
                                ? "badge-category-selected"
                                : "badge-category-outline"
                            }
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wager */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {WAGER_PRESETS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => { setWagerAmount(amt); setCustomWager(""); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            customWager === "" && wagerAmount === amt
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-card border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {amt === 0 ? "Free" : `${amt} MP`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={customWager}
                      onChange={(e) => setCustomWager(e.target.value)}
                      placeholder="Custom amount (MP)"
                      className="input-dark w-full text-sm"
                    />
                  </div>

                  {showWager && effectiveWager > 0 && !category && (
                    <p className="text-xs text-warning">
                      Pick a category too — a wager alone can't auto-start a match.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Regenerate when terms change */}
            {termsChanged && (
              <button
                onClick={generate}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary/10 border border-primary/40 text-primary hover:bg-primary/20 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
                Update invite link
              </button>
            )}

            {/* Errors — surfaced verbatim (insufficient balance, 25-invite cap, …) */}
            {isError && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{(error as Error).message}</span>
              </div>
            )}

            {isPending && !invite && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating your link…
              </div>
            )}

            {invite && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={invite.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-success/15 border border-success/40 text-success hover:bg-success/25 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <a
                    href={invite.smsUri}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-card border border-border text-foreground hover:bg-muted transition-colors"
                  >
                    <Smartphone className="w-4 h-4" />
                    SMS
                  </a>
                </div>

                <div className="flex gap-2">
                  <input
                    readOnly
                    value={invite.inviteUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="input-dark flex-1 text-xs"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  {isWagered
                    ? `Your friend joins straight into a ${effectiveWager} MP ${category?.name} match.`
                    : "A plain invite — you can challenge them once they're in the lobby."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteFriendModal;
