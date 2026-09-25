// NRB Launcher — modern frameless game-launcher UI (v0.4.0).
// Layout: custom TitleBar (drag region) -> scrollable shell -> Banner -> ProgramList -> LoginPanel.
// Auth still bridges via postMessage from the embedded hub iframe.
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";

import { TitleBar } from "./components/TitleBar";
import { Banner } from "./components/Banner";
import { ProgramList } from "./components/ProgramList";
import { LoginPanel } from "./components/LoginPanel";

import { clearAuth, loadAuth, onHubMessage, saveAuth, type AuthUser } from "./lib/auth";
import { useTheme } from "./hooks/useTheme";

const LAUNCHER_VERSION = "0.4.0";

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
  useTheme();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [online] = useState<boolean>(true);

  // Bootstrap auth from localStorage.
  useEffect(() => {
    const cached = loadAuth();
    if (cached) setUser(cached);
  }, []);

  // Re-check auth periodically: another tab/window may have logged out.
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

  // Bridge: listen for `hub-login` / `hub-logout` postMessage events.
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
    <div className="app-shell">
      <TitleBar version={LAUNCHER_VERSION} online={online} />

      <main className="app-shell-main">
        <div className="app-shell-inner">
          <Banner />

          <section className="shell-row">
            <div>
              <div className="section-title">โปรแกรม</div>
              <div className="section-sub">
                {user
                  ? "คุณเข้าสู่ระบบแล้ว — สามารถดาวน์โหลด Member โปรแกรมได้"
                  : "เข้าสู่ระบบเพื่อปลดล็อกโปรแกรมสำหรับสมาชิก"}
              </div>
            </div>
            <ProgramList loggedIn={user !== null} />
          </section>

          <section className="shell-row">
            <div>
              <div className="section-title">บัญชี Hub</div>
              <div className="section-sub">hub.nutnrb.com</div>
            </div>
            <LoginPanel user={user} onLogout={handleLogout} />
          </section>

          <footer className="app-footer">
            NRB Launcher v{LAUNCHER_VERSION} · {new Date().getFullYear()}
          </footer>
        </div>
      </main>

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
