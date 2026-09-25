// NRB Launcher — single scrollable page: TopBar → Banner → ProgramList → LoginPanel.
// v0.3.1 — restructured from a 2-column grid (left list + sticky right login)
// into a single vertical stack so the login lives at the bottom of the page.
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";

import { TopBar } from "./components/TopBar";
import { Banner } from "./components/Banner";
import { ProgramList } from "./components/ProgramList";
import { LoginPanel } from "./components/LoginPanel";

import { clearAuth, loadAuth, onHubMessage, saveAuth, type AuthUser } from "./lib/auth";
import { useTheme } from "./hooks/useTheme";

const LAUNCHER_VERSION = "0.3.1";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />
    </QueryClientProvider>
  );
}

function Shell() {
  // Apply persisted light/dark theme (sets data-theme on <html>).
  useTheme();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [online] = useState<boolean>(true);

  // Bootstrap auth from localStorage.
  useEffect(() => {
    const cached = loadAuth();
    if (cached) setUser(cached);
  }, []);

  // Re-check auth periodically: another tab/window may have logged out via the
  // hub iframe. Catches the rare case where we missed the postMessage.
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      const stillLogged = loadAuth();
      if (!stillLogged) {
        setUser(null);
        toast("ออกจากระบบแล้ว");
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [user]);

  // Bridge: listen for `hub-login` / `hub-logout` postMessage events from the
  // embedded login iframe. See hub repo `apps/web/src/app/(auth)/login/page.tsx`.
  useEffect(() => {
    return onHubMessage((msg) => {
      if (msg.type === "hub-login" && msg.user) {
        const u: AuthUser = {
          ...msg.user,
          source: "hub-iframe",
          loggedInAt: new Date().toISOString(),
        };
        saveAuth(u);
        setUser(u);
        toast.success(`เข้าสู่ระบบสำเร็จ`, {
          description: u.name || u.email,
        });
      } else if (msg.type === "hub-logout") {
        clearAuth();
        setUser(null);
        toast("ออกจากระบบแล้ว");
      }
    });
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    toast("ออกจากระบบแล้ว");
  };

  const handleDevOverride = () => {
    const fake: AuthUser = {
      name: "Dev Tester",
      email: "dev@nutnrb.local",
      role: "ADMIN",
      avatarLetter: "D",
      source: "dev-override",
      loggedInAt: new Date().toISOString(),
    };
    saveAuth(fake);
    setUser(fake);
    toast.success("Dev override — login simulated", {
      description: "Use this until hub postMessage is wired.",
    });
  };

  return (
    <div className="app app--stack">
      <TopBar version={LAUNCHER_VERSION} online={online} />
      <Banner />

      {/* Section 1: Program list — full width, scrolls with the page. */}
      <section className="stack-section stack-section--list">
        <ProgramList loggedIn={user !== null} />
      </section>

      {/* Section 2: Login — always at the bottom of the page. */}
      <section className="stack-section stack-section--login">
        <LoginPanel user={user} onLogout={handleLogout} />
      </section>

      <footer className="app-footer">
        NRB Launcher v{LAUNCHER_VERSION} · {new Date().getFullYear()}
      </footer>

      <button
        type="button"
        className="dev-override"
        onClick={handleDevOverride}
        title="Simulate a login without going through the hub iframe"
      >
        <span className="dev-override-dot" aria-hidden />
        Simulate login (dev)
      </button>
    </div>
  );
}
