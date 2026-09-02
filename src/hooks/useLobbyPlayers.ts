import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchLobbyPlayers } from "@/lib/api/lobby";
import { onPlayersUpdatedScoped } from "@/lib/socket/events";
import { getSocket } from "@/lib/socket/socket";

const LIMIT = 12;

export function useLobbyPlayers(page: number) {
  const qc = useQueryClient();
  const [socketReady, setSocketReady] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    // console.log("[useLobbyPlayers] socket.connected:", socket.connected, "socket.id:", socket.id);

    if (socket.connected) {
      // console.log("[useLobbyPlayers] socket already connected, enabling fetch");
      setSocketReady(true);
      return;
    }

    const onConnect = () => {
      // console.log("[useLobbyPlayers] socket connected! id:", socket.id);
      setSocketReady(true);
    };

    const onConnectError = (err: Error) => {
      // console.error("[useLobbyPlayers] socket connect_error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  const query = useQuery({
    queryKey: ["lobby", "players", page],
    queryFn: async () => {
      // console.log("[useLobbyPlayers] fetching page:", page);
      const res = await fetchLobbyPlayers({ page, limit: LIMIT });
      // console.log("[useLobbyPlayers] response:", JSON.stringify(res, null, 2));
      if (res.players?.length) {
        // console.log("[useLobbyPlayers] first player sample:", res.players[0]);
      }
      return res;
    },
    enabled: socketReady,
    staleTime: 30_000,
  });

  // console.log("[useLobbyPlayers] socketReady:", socketReady, "status:", query.status, "players:", query.data?.players?.length ?? 0);

  // Scoped: AppLayout also listens to players_updated for the online count.
  // The by-name teardown here (offPlayersUpdated -> socket.off("players_updated"))
  // removed BOTH listeners, so whichever unmounted last silently killed the
  // other — and because this effect re-runs on every `page` change, it happened
  // during ordinary pagination, freezing the header's online count until reload.
  useEffect(() => {
    return onPlayersUpdatedScoped(() => {
      qc.invalidateQueries({ queryKey: ["lobby", "players", page] });
    });
  }, [page, qc]);

  return query;
}
