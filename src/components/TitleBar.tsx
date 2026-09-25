// TitleBar — custom frameless chrome (v0.4.0).
// Logo + app name + version pill + Online dot + Minimize + Close.
// Entire header is the OS drag region; buttons explicitly opt out with .no-drag.
import { Minus, Moon, Sun, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTheme } from "../hooks/useTheme";

export interface TitleBarProps {
  version: string;
  online: boolean;
}

const appWindow = getCurrentWindow();

async function minimize() {
  try {
    await appWindow.minimize();
  } catch (e) {
    console.warn("minimize failed", e);
  }
}
async function close() {
  try {
    await appWindow.close();
  } catch (e) {
    console.warn("close failed", e);
  }
}

export function TitleBar({ version, online }: TitleBarProps) {
  const [theme, , toggle] = useTheme();

  return (
    <header className="titlebar drag-region" data-tauri-drag-region>
      <div className="titlebar-left no-drag">
        <div className="titlebar-logo">
          <div className="titlebar-logo-icon" aria-hidden>
            N
          </div>
          <span>NRB Launcher</span>
        </div>
        <span className="titlebar-version" title="Launcher version">
          v{version}
        </span>
      </div>

      <div className="titlebar-right no-drag">
        <span className="titlebar-status" title={online ? "Hub reachable" : "Hub unreachable"}>
          <span
            className="pulse-glow"
            style={{
              background: online ? "var(--success)" : "var(--danger)",
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
            }}
          />
          {online ? "ออนไลน์" : "ออฟไลน์"}
        </span>
        <button
          type="button"
          className="titlebar-btn"
          onClick={toggle}
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          type="button"
          className="titlebar-btn"
          onClick={minimize}
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus size={15} />
        </button>
        <button
          type="button"
          className="titlebar-btn close"
          onClick={close}
          aria-label="Close"
          title="Close"
        >
          <X size={15} />
        </button>
      </div>
    </header>
  );
}
