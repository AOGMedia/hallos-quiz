import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChallenge,
  getChallenges,
  acceptChallenge,
  declineChallenge,
  counterOffer,
  forfeitMatch,
  fetchCategories,
  cancelChallenge,
  getActiveMatch,
  type CreateChallengePayload,
  type GetChallengesParams,
  type CounterOfferPayload,
} from "@/lib/api/lobby";

export function useCategories() {
  return useQuery({
    queryKey: ["quiz", "categories"],
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateChallenge() {
  return useMutation({
    mutationFn: (payload: CreateChallengePayload) => createChallenge(payload),
  });
}

export function useChallenges(params: GetChallengesParams = {}) {
  return useQuery({
    queryKey: ["lobby", "challenges", params],
    queryFn: () => getChallenges(params),
    staleTime: 15_000,
  });
}

export function useAcceptChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptChallenge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lobby", "challenges"] }),
  });
}

export function useDeclineChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => declineChallenge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lobby", "challenges"] }),
  });
}

export function useCounterOffer() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CounterOfferPayload }) =>
      counterOffer(id, payload),
  });
}

export function useForfeitMatch() {
  return useMutation({
    mutationFn: (matchId: string) => forfeitMatch(matchId),
  });
}

export function useCancelChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelChallenge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lobby", "challenges"] }),
  });
}

export function useActiveMatch() {
  return useQuery({
    queryKey: ["lobby", "active-match"],
    queryFn: () => getActiveMatch(),
    refetchInterval: (query) => {
      // If we found a match, stop polling
      if (query.state.data?.match) return false;
      // Otherwise poll every 3 seconds to sync UX
      return 3000;
    },
    // Only enable when explicitly needed (e.g. in Lobby "Waiting" state)
    enabled: false,
  });
}
