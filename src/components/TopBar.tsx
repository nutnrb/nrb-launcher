// TopBar — logo + version + online dot + theme toggle.
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export interface TopBarProps {
  version: string;
  online: boolean;
}

export function TopBar({ version, online }: TopBarProps) {
  const [theme, , toggle] = useTheme();
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo">
          <span className="logo-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2 4 4 8-8 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>NRB Launcher</span>
        </div>
        <span className="version-pill" title={`Launcher version`}>
          v{version}
        </span>
      </div>
      <div className="topbar-right">
        <span className="online-dot" title={online ? "Hub reachable" : "Hub unreachable"}>
          {online ? "ออนไลน์" : "ออฟไลน์"}
        </span>
        <button
          type="button"
          className="icon-btn"
          onClick={toggle}
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
