// LoginPanel — iframe of hub.nutnrb.com/login?embed=1, or logged-in pill.
import { LogOut } from "lucide-react";
import type { AuthUser } from "../lib/auth";

const HUB_LOGIN_URL = "https://hub.nutnrb.com/login?embed=1";

export interface LoginPanelProps {
  user: AuthUser | null;
  onLogout: () => void;
}

function avatarLetter(user: AuthUser): string {
  const seed = user.avatarLetter || user.name || user.email || "?";
  return seed.trim().charAt(0).toUpperCase() || "?";
}

export function LoginPanel({ user, onLogout }: LoginPanelProps) {
  if (user) {
    return (
      <aside className="login-panel" aria-label="Logged in user">
        <div className="login-header">
          <h3>บัญชีของคุณ</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="logged-in-pill">
          <div className="avatar">{avatarLetter(user)}</div>
          <div className="user-info">
            <div className="user-name">{user.name || "สมาชิก"}</div>
            <div className="user-email">{user.email}</div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="login-panel" aria-label="Sign in">
      <div className="login-header">
        <h3>เข้าสู่ระบบ</h3>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>hub.nutnrb.com</span>
      </div>
      <iframe
        className="login-iframe"
        src={HUB_LOGIN_URL}
        title="Hub login"
        sandbox="allow-scripts allow-forms allow-popups"
        referrerPolicy="no-referrer"
      />
    </aside>
  );
}
