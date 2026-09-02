import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import AahbibiLogo from "@/components/icons/AahbibiLogo";
import AvatarStylePicker from "@/components/identity/AvatarStylePicker";
import AvatarPickerModal from "@/components/identity/AvatarPickerModal";
import { soundEngine } from "@/lib/soundEngine";
import { useNicknameCheck, useRegisterQuiz } from "@/hooks/useQuizProfile";
import { getAvatarUrl, fetchQuizProfile, type DiceBearStyle } from "@/lib/api/quizProfile";
import { useQuizProfileStore } from "@/store/quizProfileStore";
import { getMyUserId } from "@/lib/auth/currentUser";

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const ProfileSetup = () => {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [style, setStyle] = useState<DiceBearStyle>("avataaars");
  const [avatarSeed, setAvatarSeed] = useState(""); // empty = use nickname as seed
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  // Kept separate from validationError, which renders up beside the form —
  // feedback for this button belongs next to the button.
  const [existingCheckError, setExistingCheckError] = useState("");

  // Live nickname availability check (debounced inside hook)
  const {
    data: checkData,
    isFetching: isChecking,
    isError: isCheckError,
    error: checkError,
  } = useNicknameCheck(nickname);
  const isAvailable = checkData ? checkData.available : null;

  // Registration mutation
  const { mutate: register, isPending, isError, error } = useRegisterQuiz();

  // Preview URL — uses custom seed if picked from modal, otherwise nickname
  const previewUrl = useMemo(
    () => getAvatarUrl(avatarSeed || nickname || "preview", style),
    [avatarSeed, nickname, style]
  );

  // Submission URL — always uses nickname as seed (backend requirement)
  const avatarUrl = useMemo(
    () => getAvatarUrl(nickname || "preview", style),
    [nickname, style]
  );

  const isNicknameValid = NICKNAME_REGEX.test(nickname);
  const canSubmit =
    isNicknameValid &&
    isAvailable === true &&
    agreedToTerms &&
    !isPending &&
    !isChecking;

  /**
   * Why the submit button is disabled. Without this the button just sits greyed
   * out with no explanation — especially confusing when the availability check
   * itself failed (backend down / 401), since that leaves `isAvailable` null
   * and renders neither the green tick nor the red X.
   */
  const disabledReason = (() => {
    if (canSubmit || isPending) return null;
    if (!nickname) return "Enter a nickname to continue";
    if (!isNicknameValid) return "Nickname must be 3–30 characters, letters/numbers/_ only";
    if (isChecking) return "Checking nickname availability…";
    if (isCheckError) return "Couldn't check nickname availability — check your connection and try again";
    if (isAvailable === false) return "That nickname is taken — try another";
    if (isAvailable === null) return "Waiting on nickname availability…";
    if (!agreedToTerms) return "Please agree to the terms of use to continue";
    return null;
  })();

  const handleStartPlaying = () => {
    if (!isNicknameValid) {
      setValidationError("3–30 characters, letters/numbers/_ only");
      return;
    }
    if (!agreedToTerms) return;
    setValidationError("");

    register(
      { nickname, avatarUrl },
      {
        onSuccess: (data) => {
          // Handle "already registered" gracefully — treat as success
          const alreadyRegistered =
            !data.success && data.message?.includes("already credited");

          if (data.success || alreadyRegistered) {
            soundEngine.play("registered");
            // Persist to sessionStorage for Lobby + store
            sessionStorage.setItem(
              "userProfile",
              JSON.stringify({ nickname: data.nickname ?? nickname, avatar: avatarUrl })
            );
            // Store is already seeded by useRegisterQuiz onSuccess
            navigate("/lobby");
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Exit button */}
      <button onClick={() => navigate("/")} className="btn-exit absolute top-6 left-6 z-10">
        <ArrowLeft className="w-4 h-4" />
        EXIT
      </button>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center space-y-6">
          {/* Logo */}
          <AahbibiLogo className="h-10 justify-center mx-auto" />

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Setup your game identity</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Pick a nickname and avatar — you'll get <span className="text-primary font-medium">100 MP free</span>
            </p>
          </div>

          {/* Live avatar preview */}
          <div className="flex flex-col items-center gap-2">
            <img
              src={previewUrl}
              alt="avatar preview"
              className="w-20 h-20 rounded-full border-2 border-primary bg-secondary"
            />
            <p className="text-xs text-muted-foreground">
              {nickname || "Your avatar preview"}
            </p>
          </div>

          {/* Nickname input with live check */}
          <div className="text-left">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Nickname"
                value={nickname}
                maxLength={30}
                onChange={(e) => { setNickname(e.target.value); setValidationError(""); }}
                className="input-dark w-full text-center pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                {!isChecking && isCheckError && (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
                {!isChecking && !isCheckError && isAvailable === true && isNicknameValid && (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                )}
                {!isChecking && !isCheckError && isAvailable === false && (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </span>
            </div>
            {!isChecking && !isCheckError && isAvailable === true && isNicknameValid && (
              <p className="text-xs text-green-400 mt-1 text-center">Nickname is available ✓</p>
            )}
            {!isChecking && !isCheckError && isAvailable === false && (
              <p className="text-xs text-red-400 mt-1 text-center">Nickname is taken</p>
            )}
            {!isChecking && isCheckError && (
              <p className="text-xs text-yellow-400 mt-1 text-center">
                Couldn&apos;t check availability: {(checkError as Error)?.message ?? "request failed"}
              </p>
            )}
            {validationError && (
              <p className="text-xs text-red-400 mt-1 text-center">{validationError}</p>
            )}
          </div>

          {/* Avatar style picker */}
          <div className="text-left">
            <AvatarStylePicker
              nickname={nickname}
              selectedStyle={style}
              onSelect={(s) => { setStyle(s); setAvatarSeed(""); }}
              onBrowseMore={() => setShowAvatarModal(true)}
            />
          </div>

          {/* API error */}
          {isError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {(error as Error).message}
            </div>
          )}

          {/* Terms checkbox */}
          <div className="flex items-start gap-3 text-left">
            <button
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
                agreedToTerms ? "bg-primary border-primary" : "border-muted-foreground"
              }`}
            >
              {agreedToTerms && <Check className="w-3 h-3 text-primary-foreground" />}
            </button>
            <p className="text-sm text-muted-foreground">
              By checking this box you agree to the{" "}
              <a href="#" className="text-primary hover:underline">terms of use</a> and{" "}
              <a href="#" className="text-primary hover:underline">privacy policy</a>
              <span className="text-primary ml-1" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </p>
          </div>

          {/* Submit */}
          <div>
            <button
              onClick={handleStartPlaying}
              disabled={!canSubmit}
              className={`btn-primary w-full ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isPending ? "Setting up..." : "Start Playing"}
            </button>
            {disabledReason && (
              <p className="text-xs text-muted-foreground mt-2 text-center">{disabledReason}</p>
            )}
          </div>

          {/* Already registered link */}
          <button
            type="button"
            disabled={isCheckingExisting}
            onClick={async () => {
              // Only enter the lobby if this user actually has a profile.
              //
              // Every branch here used to navigate to /lobby regardless — including
              // the failure paths. AppLayout renders nothing without a resolved
              // identity and bounces back to "/", so an unregistered user landed on
              // a blank screen (or a redirect loop) instead of being told to finish
              // setting up. Now: registered -> lobby; not registered -> stay here
              // with an explanation.
              setExistingCheckError("");
              setIsCheckingExisting(true);
              try {
                const userId = getMyUserId();
                if (!userId) {
                  setExistingCheckError("You're signed out. Please sign in again to continue.");
                  return;
                }

                const res = await fetchQuizProfile(userId);
                if (res.profile?.nickname) {
                  const p = { nickname: res.profile.nickname, avatar: res.profile.avatarUrl };
                  sessionStorage.setItem("userProfile", JSON.stringify(p));
                  useQuizProfileStore.getState().setProfile(res.profile);
                  navigate("/lobby");
                  return;
                }
                setExistingCheckError("No quiz identity found for your account — pick a nickname and avatar above to get started.");
              } catch (err) {
                // 404 is the expected "not registered yet" answer, not a fault.
                const status = (err as { status?: number })?.status;
                setExistingCheckError(
                  status === 404
                    ? "You haven't set up a quiz identity yet — pick a nickname and avatar above to get started."
                    : "Couldn't check your profile just now. Please try again."
                );
              } finally {
                setIsCheckingExisting(false);
              }
            }}
            className="text-lg text-muted-foreground hover:text-primary transition-colors text-center w-full disabled:opacity-50"
          >
            {isCheckingExisting ? (
              "Checking your profile..."
            ) : (
              <>Already registered? <span className="text-primary underline">Go to Lobby</span></>
            )}
          </button>
          {existingCheckError && (
            <p className="text-xs text-red-400 -mt-2 text-center">{existingCheckError}</p>
          )}
        </div>
      </div>

      {/* Avatar picker modal */}
      {showAvatarModal && (
        <AvatarPickerModal
          nickname={nickname}
          selectedStyle={style}
          onSelect={(newStyle, seed) => {
            setStyle(newStyle);
            setAvatarSeed(seed);
          }}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  );
};

export default ProfileSetup;
