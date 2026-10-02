// CutaiStatusBadge — 🟢/🟡/⚪ dot + GPU name shown in the titlebar.
// Phase 0: green = last heartbeat < 30s ago; grey = offline; yellow unused.
// Mutating surface = none (read-only indicator).
import { useCutaiHeartbeat, type CutaiStatus } from "../hooks/useCutaiHeartbeat";

export interface CutaiStatusBadgeProps {
  enabled: boolean;
}

const DOT_COLOR: Record<CutaiStatus, string> = {
  online: "var(--success)",
  degraded: "var(--warning, #f59e0b)",
  offline: "var(--text-muted, #888)",
};

const LABEL: Record<CutaiStatus, string> = {
  online: "CutAI ออนไลน์",
  degraded: "CutAI degraded",
  offline: "CutAI ออฟไลน์",
};

export function CutaiStatusBadge({ enabled }: CutaiStatusBadgeProps) {
  const { status, gpu } = useCutaiHeartbeat(enabled);
  const title = gpu ? `${LABEL[status]} · ${gpu}` : LABEL[status];
  return (
    <span className="titlebar-cutai" title={title}>
      <span
        className="pulse-glow"
        style={{
          background: DOT_COLOR[status],
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
        }}
      />
      <span className="cutai-label">
        {status === "online" ? "CutAI" : status === "offline" ? "CutAI ✕" : "CutAI ⚠"}
      </span>
    </span>
  );
}