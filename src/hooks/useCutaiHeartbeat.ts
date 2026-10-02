// CutAI heartbeat hook — Phase 0 of the v3 plan.
//
// Polls `cutai_heartbeat` every 30s while enabled. The command is a
// fire-and-forget ping in Phase 0: it returns `()` and the GPU snapshot
// is server-side only (the hub stores it; the client just lights up
// the badge green). The frontend doesn't get GPU info back from the
// command — Phase 1 will add a `cutai_gpu_info` command that returns
// the locally-cached GpuInfo struct, at which point we'll populate
// `gpu` in the state below.
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export type CutaiStatus = "online" | "degraded" | "offline";

export interface CutaiStatusState {
  status: CutaiStatus;
  gpu: string | null;
  /** Last successful heartbeat tick (ISO string), or null if never. */
  lastSeen: string | null;
}

const POLL_INTERVAL_MS = 30_000;

export function useCutaiHeartbeat(enabled: boolean): CutaiStatusState {
  const [state, setState] = useState<CutaiStatusState>({
    status: "offline",
    gpu: null,
    lastSeen: null,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ status: "offline", gpu: null, lastSeen: null });
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        await invoke<void>("cutai_heartbeat");
        if (!cancelled) {
          setState((prev) => ({
            status: "online",
            gpu: prev.gpu,
            lastSeen: new Date().toISOString(),
          }));
        }
      } catch (e) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, status: "offline" }));
        }
        // eslint-disable-next-line no-console
        console.warn("cutai_heartbeat failed", e);
      }
    };

    tick();
    timer = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [enabled]);

  return state;
}