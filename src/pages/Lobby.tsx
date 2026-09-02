"use client";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { UserPlus } from "lucide-react";
import LobbyPlayerCard from "@/components/lobby/LobbyPlayerCard";
import ChallengeModal from "@/components/modals/ChallengeModal";
import ChallengeStatusModal from "@/components/modals/ChallengeStatusModal";
import ChallengeBoardTab from "@/components/lobby/ChallengeBoardTab";
import LiveMatchesPanel from "@/components/lobby/LiveMatchesPanel";
import InviteFriendModal from "@/components/invite/InviteFriendModal";
import { soundEngine } from "@/lib/soundEngine";
import { useLobbyPlayers } from "@/hooks/useLobbyPlayers";
import { useCreateChallenge, useAcceptChallenge, useDeclineChallenge, useCancelChallenge, useActiveMatch } from "@/hooks/useChallenge";
import { useGetOrCreateConversation } from "@/hooks/useChat";
import type { LobbyPlayer } from "@/lib/api/lobby";
import { getSocket } from "@/lib/socket/socket";
import {
  onChallengeDeclinedScoped,
  onChallengeTimeoutScoped,
  onChallengeCounterScoped,
} from "@/lib/socket/events";
import { joinMatch } from "@/lib/socket/emitters";

type ModalState =
  | "none" | "challenge" | "confirm" | "waiting"
  | "timeout" | "rejected" | "accepted" | "counter";

interface OutletCtx {
  userProfile: { nickname: string; avatar: string };
  searchQuery?: string;
}

const Lobby = () => {
  const navigate = useNavigate();
  const { userProfile, searchQuery = "" } = useOutletContext<OutletCtx>();

  const [lobbyTab, setLobbyTab] = useState<"players" | "challenges">("players");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedPlayer, setSelectedPlayer] = useState<LobbyPlayer | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [wagerAmount, setWagerAmount] = useState(0);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState<{ amount: number; opponentNickname: string; challengeId: string } | null>(null);
  const activeChallengeIdRef = useRef<string | null>(null);

  const { data, isLoading } = useLobbyPlayers(page);
  const { mutate: createChallenge, isPending: isCreatingChallenge } = useCreateChallenge();
  const { mutate: acceptCounterChallenge } = useAcceptChallenge();
  const { mutate: declineCounterChallenge } = useDeclineChallenge();
  const { mutate: cancelChallenge } = useCancelChallenge();

  // Enable polling for active match ONLY when in waiting state (challenger waiting for opponent)
  const isPollingForMatch = modalState === "waiting";
  const { data: activeMatchData } = useActiveMatch({ enabled: isPollingForMatch });

  // Clean stale match data on Lobby mount — prevents zombie redirects
  useEffect(() => {
    sessionStorage.removeItem("currentMatch");
    sessionStorage.removeItem("matchEnded");
  }, []);

  // Listen for challenge lifecycle socket events
  // Use refs for callbacks so we don't need to re-register on every render
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    const getMyId = () => {
      try {
        const token = sessionStorage.getItem("auth_token");
        if (!token) return null;
        return Number(JSON.parse(atob(token.split(".")[1]))?.id);
      } catch { return null; }
    };

    const handleChallengeAccepted = (payload: import("@/lib/socket/events").ChallengeAcceptedPayload) => {
      // Tournament knockout pairings are handled globally by TournamentWatcher
      // (it needs to whisk the user into /game no matter which page they're
      // on, not just while Lobby happens to be mounted).
      if (payload.tournamentId) return;
      if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
      soundEngine.stopBellLoop();
      soundEngine.play("start_challenge");
      setModalState("accepted");
      const stored = sessionStorage.getItem("userProfile");
      const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
      sessionStorage.removeItem("matchEnded");
      sessionStorage.setItem("currentMatch", JSON.stringify({
        matchId: payload.matchId,
        player1: { name: me.nickname, avatar: me.avatar },
        player2: { userId: payload.opponent.userId, name: payload.opponent.nickname, avatar: payload.opponent.avatarUrl },
        questions: payload.questions,
        challengerId: getMyId(),
      }));
      // Join match room immediately so we don't miss opponent_progress events
      joinMatch(payload.matchId);
      setTimeout(() => navigateRef.current("/game"), 800);
    };

    // Scoped subscriptions, bound once. These previously used the by-name
    // helpers and were re-registered inside a `connect` handler, which meant
    // a decline/timeout/counter arriving mid-teardown was dropped and the
    // challenger's modal never updated — they sat on "waiting" forever.
    // Socket.IO keeps client listeners across reconnects, so there is nothing
    // to re-register: binding once is both sufficient and race-free.
    const handleDeclined = (payload: import("@/lib/socket/events").ChallengeDeclinedPayload) => {
      if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
      soundEngine.stopBellLoop();
      setModalState("rejected");
    };

    const handleTimeout = (payload: import("@/lib/socket/events").ChallengeTimeoutPayload) => {
      if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
      soundEngine.stopBellLoop();
      setModalState("timeout");
    };

    const handleCounter = (payload: import("@/lib/socket/events").ChallengeCounterPayload) => {
      if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
      // Store the counter-offer's new challengeId so we can accept/decline it
      setCounterOffer({ amount: payload.newWagerAmount, opponentNickname: payload.opponentNickname, challengeId: payload.challengeId });
      setModalState("counter" as ModalState);
    };

    const unsubDeclined = onChallengeDeclinedScoped(handleDeclined);
    const unsubTimeout = onChallengeTimeoutScoped(handleTimeout);
    const unsubCounter = onChallengeCounterScoped(handleCounter);

    // challenge_accepted is bound directly to the socket with its own handler
    // reference — deliberately NOT via the shared onChallengeAccepted /
    // offChallengeAccepted helpers used for the other three events above.
    // offChallengeAccepted() calls socket.off("challenge_accepted") with no
    // handler argument, which removes EVERY listener bound to that event name,
    // not just Lobby's own. TournamentWatcher (mounted once, globally, for the
    // whole session) also listens for "challenge_accepted" to route knockout
    // tournament matches into /game. Calling offChallengeAccepted() here — on
    // every Lobby mount AND unmount — was silently deleting TournamentWatcher's
    // listener the first time a user navigated away from /lobby, which is the
    // default landing route for every registered user. After that, the server
    // still emitted challenge_accepted correctly for a tournament match, but
    // nothing on the client was left listening for it, so the tournament
    // detail screen just sat there with no navigation into the match.
    // Binding/removing by reference here avoids touching any other
    // component's listeners, and Socket.IO's client-side listener list
    // persists across reconnects, so there's no need to re-bind on "connect"
    // the way the other three events below (harmlessly, since Lobby is their
    // only consumer) already do.
    const socket = getSocket();
    socket.on("challenge_accepted", handleChallengeAccepted);

    // NOTE: there was previously a `socket.on("connect", ...)` here that
    // re-registered the listeners on every reconnect, with cleanup attempting
    // `socket.off("connect", registerListeners)`. That removed nothing: the
    // registered handler was an anonymous arrow, not `registerListeners`, so
    // the references never matched. Every Lobby mount leaked another `connect`
    // handler, and each one re-ran the by-name teardown, so a reconnect could
    // wipe listeners belonging to other components. It is gone entirely rather
    // than repaired, because Socket.IO preserves client-side listeners across
    // reconnects, making the whole re-registration unnecessary.
    return () => {
      socket.off("challenge_accepted", handleChallengeAccepted);
      unsubDeclined();
      unsubTimeout();
      unsubCounter();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle auto-start from poll if socket message was missed.
  // SAFETY: Only triggers if (a) we are actively waiting, (b) active match exists,
  // and (c) the matchId matches our current challengeId — prevents ghost redirects.
  useEffect(() => {
    if (!isPollingForMatch || !activeMatchData?.match) return;

    const match = activeMatchData.match;

    // Safety: don't redirect if match has no questions (stale/incomplete data)
    if (!match.questions || match.questions.length === 0) return;
    if (!match.matchId) return;

    // CRITICAL: Only act on this match if it corresponds to the challenge we just created.
    // This prevents ghost redirects from old/unrelated matches.
    // In this backend, matchId === challengeId, so compare against our tracked challenge.
    const currentChallengeId = activeChallengeIdRef.current;
    if (currentChallengeId && match.matchId !== currentChallengeId) {
      return; // Not our match — ignore
    }

    // Never start a match we can't name a real opponent for. This used to fall
    // back to `{ name: "Opponent", avatar: "" }`, which put the player into a
    // real, wagered game against nobody — no answers could ever arrive from
    // "them", so it hung until the AFK/forfeit sweep resolved it.
    if (!match.challenger?.userId) {
      console.warn("[Lobby] Match arrived without a real opponent — not starting", match.matchId);
      return;
    }

    soundEngine.stopBellLoop();
    soundEngine.play("start_challenge");
    setModalState("accepted");

    sessionStorage.removeItem("matchEnded");
    sessionStorage.setItem("currentMatch", JSON.stringify({
      matchId: match.matchId,
      player1: { name: userProfile.nickname, avatar: userProfile.avatar },
      player2: { userId: match.challenger.userId, name: match.challenger.nickname, avatar: match.challenger.avatarUrl },
      questions: match.questions,
      challengerId: match.challengerId,
    }));

    joinMatch(match.matchId);
    setTimeout(() => navigate("/game"), 800);
  }, [activeMatchData, isPollingForMatch, navigate, userProfile]);

  const players = (data?.players ?? []).filter((p) =>
    searchQuery === "" || p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = data?.totalPages ?? 1;

  const handleChallenge = (player: LobbyPlayer) => {
    setSelectedPlayer(player);
    setModalState("challenge");
    soundEngine.startBellLoop();
  };

  const { mutate: getOrCreateConversation } = useGetOrCreateConversation();
  const handleMessage = (player: LobbyPlayer) => {
    getOrCreateConversation(player.userId, {
      onSuccess: (res) => {
        navigate("/chat", { state: { openConversationId: res.conversationId } });
      },
    });
  };

  const handleChallengeSubmit = (payload: { categoryId: string; categoryName: string; wagerAmount: number }) => {
    setSelectedCategories([payload.categoryName]); // display name for UI
    setSelectedCategoryId(payload.categoryId);     // UUID for API
    setWagerAmount(payload.wagerAmount);
    setChallengeError(null);
    setModalState("confirm");
  };

  const handleConfirmChallenge = () => {
    if (!selectedPlayer) return;
    setModalState("waiting");

    createChallenge(
      {
        wagerAmount,
        categoryId: selectedCategoryId,  // real UUID
        opponentId: selectedPlayer.userId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setChallengeId(data.challengeId);
            activeChallengeIdRef.current = data.challengeId;
          } else {
            setChallengeError("Failed to create challenge");
            setModalState("confirm");
          }
        },
        onError: (err) => {
          setChallengeError((err as Error).message ?? "Failed to create challenge");
          setModalState("confirm");
        },
      }
    );
  };

  const handleCancelChallenge = () => {
    if (challengeId) {
      cancelChallenge(challengeId);
    }
    closeModal();
  };

  const closeModal = () => {
    soundEngine.stopBellLoop();
    setModalState("none");
    setSelectedPlayer(null);
    setSelectedCategories([]);
    setSelectedCategoryId("");
    setWagerAmount(0);
    setChallengeId(null);
    setChallengeError(null);
    setCounterOffer(null);
    activeChallengeIdRef.current = null;
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Live matches happening right now — renders nothing when idle */}
        <LiveMatchesPanel />

        {/* Tab switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {(["players", "challenges"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLobbyTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                  lobbyTab === tab
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab === "players" ? "Players" : "Challenge Board"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite a friend</span>
          </button>
        </div>

        {lobbyTab === "players" ? (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="card-player animate-pulse h-40 bg-card" />
                ))}
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-3xl">{searchQuery ? "🔍" : "🎮"}</span>
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  {searchQuery ? `No players matching "${searchQuery}"` : "No players online right now"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different nickName" : "Check back soon - the lobby fills up fast"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary mt-5 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite a friend to play
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch justify-items-stretch [&>*]:min-w-0">
                {players.map((player) => (
                  <LobbyPlayerCard
                    key={player.userId}
                    name={player.nickname}
                    avatar={player.avatarUrl}
                    points={Number(player.chutaBalance ?? 0)}
                    wins={player.wins}
                    losses={player.losses}
                    onChallenge={() => handleChallenge(player)}
                    userId={player.userId}
                    onMessage={() => handleMessage(player)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-border bg-card text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-border bg-card text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <ChallengeBoardTab
            onAccept={(challengeId, matchId, challenger, questions) => {
              // Safety check: don't navigate if no questions
              if (!questions || questions.length === 0) {
                console.warn("[Lobby] Challenge accepted but no questions received");
                return;
              }
              // Same rule as the accepted-match handler above: a match without
              // a real, identified opponent is not playable, so don't enter it.
              if (!challenger?.userId) {
                console.warn("[Lobby] Challenge accepted without a real opponent — not starting", matchId);
                return;
              }
              soundEngine.play("start_challenge");
              const stored = sessionStorage.getItem("userProfile");
              const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
              sessionStorage.removeItem("matchEnded");
              sessionStorage.setItem("currentMatch", JSON.stringify({
                matchId,
                player1: { name: me.nickname, avatar: me.avatar },
                player2: { userId: challenger.userId, name: challenger.nickname, avatar: challenger.avatarUrl },
                questions: questions ?? [],
                challengerId: challenger.userId,
              }));
              // Join match room immediately
              joinMatch(matchId);
              navigate("/game");
            }}
          />
        )}
      </main>

      {showInviteModal && (
        <InviteFriendModal onClose={() => setShowInviteModal(false)} />
      )}

      {modalState === "challenge" && selectedPlayer && (
        <ChallengeModal
          player={{ name: selectedPlayer.nickname, avatar: selectedPlayer.avatarUrl, points: selectedPlayer.chutaBalance ?? 0, form: ["W", "W", "D", "L", "W"] }}
          onClose={closeModal}
          onChallenge={handleChallengeSubmit}
        />
      )}

      {(["confirm", "waiting", "timeout", "rejected", "accepted", "counter"] as ModalState[]).includes(modalState) && selectedPlayer && (
        <ChallengeStatusModal
          type={modalState as "confirm" | "waiting" | "timeout" | "rejected" | "accepted" | "counter"}
          player={{ name: selectedPlayer.nickname, avatar: selectedPlayer.avatarUrl }}
          challenger={{ name: userProfile.nickname || "You", avatar: userProfile.avatar }}
          categories={selectedCategories.length > 0 ? selectedCategories : ["General knowledge"]}
          wagerAmount={wagerAmount}
          counterAmount={counterOffer?.amount}
          onClose={closeModal}
          onConfirm={isCreatingChallenge ? undefined : handleConfirmChallenge}
          error={challengeError}
          onCancel={handleCancelChallenge}
          onResend={() => setModalState("waiting")}
          onEditTerms={() => setModalState("challenge")}
          onBackToLobby={closeModal}
          onTimeout={() => setModalState("timeout")}
          onAcceptCounter={() => {
            if (!counterOffer) return;
            acceptCounterChallenge(counterOffer.challengeId, {
              onSuccess: (res) => {
                if (res.matchId) {
                  closeModal();
                  const stored = sessionStorage.getItem("userProfile");
                  const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
                  sessionStorage.removeItem("matchEnded");
                  sessionStorage.setItem("currentMatch", JSON.stringify({
                    matchId: res.matchId,
                    player1: { name: me.nickname, avatar: me.avatar },
                    player2: selectedPlayer
                      ? { userId: selectedPlayer.userId, name: selectedPlayer.nickname, avatar: selectedPlayer.avatarUrl }
                      : { name: counterOffer.opponentNickname, avatar: "" },
                    questions: res.questions ?? [],
                    // In a counter-offer, the opponent who countered is now the challenger
                    challengerId: res.challenger?.userId,
                  }));
                  joinMatch(res.matchId);
                  navigate("/game");
                }
              },
              onError: (err) => {
                setChallengeError((err as Error).message ?? "Failed to accept counter offer");
              },
            });
          }}
          onDeclineCounter={() => {
            if (counterOffer) {
              declineCounterChallenge(counterOffer.challengeId, {
                onSuccess: () => closeModal(),
                onError: () => closeModal(),
              });
            } else {
              closeModal();
            }
          }}
        />
      )}
    </>
  );
};

export default Lobby;
