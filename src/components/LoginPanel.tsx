// LoginPanel — embedded hub login (v0.4.0).
// Seamlessly integrates hub.nutnrb.com/login via iframe; on load, injects
// CSS into the iframe document to strip the hub own nav/sidebar/footer
// so the embedded login looks like part of the launcher (no chrome).
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, RefreshCw } from "lucide-react";
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

/** CSS injected into the hub iframe to strip its chrome in embed mode. */
const HUB_EMBED_CSS = `
  /* Hide hub navigation / sidebar / footer in embed mode */
  nav, header.site-header, aside, footer.site-footer, .hub-sidebar, .hub-nav { display: none !important; }
  body { padding: 0 !important; background: transparent !important; margin: 0 !important; }
  main, .hub-main, .hub-content { max-width: 100% !important; padding: 1.25rem 1.5rem !important; margin: 0 !important; }
  /* Make the login form feel native to the launcher */
  .card, .login-card, [class*="card"] { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
  /* Soften link/button colors to match launcher */
  a { color: var(--primary, #00b4ff) !important; }
  input, button { font-family: inherit !important; }
`;

export function LoginPanel({ user, onLogout }: LoginPanelProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Strip hub chrome by injecting CSS overlay into iframe on load.
  useEffect(() => {
    if (user) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    function onLoad() {
      try {
        const doc = iframe?.contentDocument;
        if (!doc) return;
        if (doc.getElementById("__nrb_embed_overlay__")) return;
        const style = doc.createElement("style");
        style.id = "__nrb_embed_overlay__";
        style.textContent = HUB_EMBED_CSS;
        doc.head?.appendChild(style);
        doc.body?.setAttribute("data-nrb-embed", "1");
      } catch {
        // CORS-blocked — silently ignore; hub is on a different origin so we
        // may not always have access. The seamless class + transparent
        // background still helps visually.
      }
    }

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [iframeKey, user]);

  if (user) {
    return (
      <div className="login-panel" aria-label="Logged in user">
        <div className="logged-in-pill">
          <div className="avatar" aria-hidden>
            {avatarLetter(user)}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name || "สมาชิก"}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="Logout"
          >
            <LogOut size={14} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-panel" aria-label="Sign in">
      <div className="login-header">
        <h3>
          <span className="login-header-icon" aria-hidden>
            <LogIn size={12} color="white" />
          </span>
          เข้าสู่ระบบ Hub
        </h3>
        <button
          type="button"
          className="titlebar-btn no-drag"
          onClick={() => setIframeKey((k) => k + 1)}
          title="Reload"
          aria-label="Reload"
          style={{ width: 28, height: 28 }}
        >
          <RefreshCw size={12} />
        </button>
      </div>
      <iframe
        key={iframeKey}
        ref={iframeRef}
        className="login-iframe"
        src={HUB_LOGIN_URL}
        title="Hub login"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-storage-access-by-user-activation"
        referrerPolicy="no-referrer"
        scrolling="no"
        style={{ height: 420 }}
      />
    </div>
  );
}
