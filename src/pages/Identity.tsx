import { useState, useMemo } from "react";
import { AlertCircle, Edit2, Save, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import NicknameInput from "@/components/identity/NicknameInput";
import AvatarStylePicker from "@/components/identity/AvatarStylePicker";
import AvatarPickerModal from "@/components/identity/AvatarPickerModal";
import ProfileStatsCard from "@/components/identity/ProfileStatsCard";
import { useNicknameCheck, useUpdateQuizProfile, useQuizProfileQuery } from "@/hooks/useQuizProfile";
import { useQuizProfileStore } from "@/store/quizProfileStore";
import { getAvatarUrl, DICEBEAR_STYLES, type DiceBearStyle } from "@/lib/api/quizProfile";
import { getToken } from "@/store/authStore";

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilNicknameChange(nicknameChangedAt: string | null | undefined): number {
  if (!nicknameChangedAt) return 0;
  const elapsed = Date.now() - new Date(nicknameChangedAt).getTime();
  const remaining = TWO_WEEKS_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / (24 * 60 * 60 * 1000)) : 0;
}

// ── Edit form ─────────────────────────────────────────────────────────────────

const EditForm = ({ onCancel }: { onCancel: () => void }) => {
  const profile = useQuizProfileStore((s) => s.profile)!;

  const currentStyle = (DICEBEAR_STYLES.find((s) =>
    profile.avatarUrl.includes(s)
  ) ?? "avataaars") as DiceBearStyle;

  const [nickname, setNickname] = useState(profile.nickname);
  const [style, setStyle] = useState<DiceBearStyle>(currentStyle);
  const [avatarSeed, setAvatarSeed] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Cooldown check — disable nickname field if within 2 weeks
  const cooldownDays = daysUntilNicknameChange(
    (profile as unknown as { nicknameChangedAt?: string }).nicknameChangedAt
  );
  const nicknameOnCooldown = cooldownDays > 0;

  // Only check availability if nickname actually changed and not on cooldown
  const nicknameChanged = nickname !== profile.nickname;
  const { data: checkData, isFetching: isChecking } = useNicknameCheck(
    nicknameChanged && !nicknameOnCooldown ? nickname : ""
  );

  const { mutate: update, isPending, isError, error } = useUpdateQuizProfile(profile.userId);

  const isAvailable = !nicknameChanged ? true : checkData ? checkData.available : null;

  const avatarUrl = useMemo(
    () => getAvatarUrl(nickname || profile.nickname, style),
    [nickname, style, profile.nickname]
  );

  const previewUrl = useMemo(
    () => getAvatarUrl(avatarSeed || nickname || profile.nickname, style),
    [avatarSeed, nickname, style, profile.nickname]
  );

  const canSubmit =
    NICKNAME_REGEX.test(nickname) &&
    (nicknameOnCooldown ? !nicknameChanged : isAvailable === true) &&
    !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!NICKNAME_REGEX.test(nickname)) {
      setValidationError("3–30 characters, letters/numbers/_ only");
      return;
    }
    setValidationError("");
    const payload: { nickname?: string; avatarUrl: string } = { avatarUrl };
    if (nicknameChanged && !nicknameOnCooldown) payload.nickname = nickname;
    update(payload, { onSuccess: onCancel });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-foreground">Edit Identity</h3>
          <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <img
            src={previewUrl}
            alt="preview"
            className="w-14 h-14 rounded-full border-2 border-primary bg-secondary flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-foreground">{nickname}</p>
            <p className="text-xs text-muted-foreground">Preview updates live</p>
          </div>
        </div>

        {/* Nickname — disabled if on cooldown */}
        {nicknameOnCooldown ? (
          <div className="p-3 bg-card border border-border rounded-xl flex items-start gap-2">
            <Clock className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-foreground font-medium">Nickname locked</p>
              <p className="text-xs text-muted-foreground">
                You can change your nickname in{" "}
                <span className="text-warning font-medium">{cooldownDays} day{cooldownDays !== 1 ? "s" : ""}</span>
              </p>
            </div>
          </div>
        ) : (
          <NicknameInput
            value={nickname}
            onChange={(v) => { setNickname(v); setValidationError(""); }}
            isChecking={isChecking}
            isAvailable={isAvailable}
            error={validationError}
          />
        )}

        {/* Avatar style picker + browse more */}
        <AvatarStylePicker
          nickname={avatarSeed || nickname}
          selectedStyle={style}
          onSelect={(s) => { setStyle(s); setAvatarSeed(""); }}
          onBrowseMore={() => setShowAvatarModal(true)}
        />

        {/* API error */}
        {isError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {(error as Error).message}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 border-border text-sm">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 bg-primary hover:bg-primary/90 text-sm disabled:opacity-40"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {showAvatarModal && (
        <AvatarPickerModal
          nickname={avatarSeed || nickname}
          selectedStyle={style}
          onSelect={(newStyle, seed) => { setStyle(newStyle); setAvatarSeed(seed); }}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const Identity = () => {
  const { profile, isRegistered } = useQuizProfileStore();
  const [isEditing, setIsEditing] = useState(false);

  // Decode userId from JWT and fetch fresh profile data
  const userId = (() => {
    try {
      const token = getToken();
      if (!token) return 0;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload?.id ?? 0;
    } catch { return 0; }
  })();

  const { isLoading } = useQuizProfileQuery(userId);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-primary mb-1">Game Identity</h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          Your quiz persona — nickname, avatar, and stats
        </p>
      </div>

      {/* Not registered — prompt to go through profile setup */}
      {!isRegistered && !isLoading && (
        <div className="max-w-lg bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm sm:text-base text-foreground font-medium">No quiz identity yet</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Your identity is created during the initial profile setup. If you haven't done that yet,
            exit and go through the setup flow.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Registered — view + edit */}
      {!isLoading && isRegistered && profile && (
        <div className="space-y-6 sm:space-y-8 max-w-2xl">
          {/* Profile card */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
            {isEditing ? (
              <EditForm onCancel={() => setIsEditing(false)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.nickname}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-primary bg-secondary flex-shrink-0"
                  />
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-foreground">{profile.nickname}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {profile.lobbyStats.wins}W · {profile.lobbyStats.losses}L ·{" "}
                      {profile.lobbyStats.winRate.toFixed(1)}% win rate
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-lg bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  title="Edit identity"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Stats — hidden while editing */}
          {!isEditing && <ProfileStatsCard profile={profile} />}
        </div>
      )}
    </div>
  );
};

export default Identity;
