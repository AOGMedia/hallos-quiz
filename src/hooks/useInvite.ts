import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvite,
  resolveInvite,
  claimInvite,
  getMyInvites,
  revokeInvite,
  type CreateInvitePayload,
} from "@/lib/api/invite";

/**
 * Public resolve — powers the landing page before the user is authenticated.
 * `retry: false` so a dead link shows its screen immediately instead of after
 * three round trips.
 */
export function useResolveInvite(token: string) {
  return useQuery({
    queryKey: ["invite", "resolve", token],
    queryFn: () => resolveInvite(token),
    enabled: !!token,
    retry: false,
    staleTime: 30_000,
  });
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: (payload: CreateInvitePayload) => createInvite(payload),
  });
}

export function useClaimInvite() {
  return useMutation({
    mutationFn: (token: string) => claimInvite(token),
  });
}

export function useMyInvites(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["invite", "mine", params],
    queryFn: () => getMyInvites(params),
    staleTime: 15_000,
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeInvite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invite", "mine"] }),
  });
}
