// NRB Launcher — single-screen home.
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";

import { TopBar } from "./components/TopBar";
import { Banner } from "./components/Banner";
import { ProgramList } from "./components/ProgramList";
import { LoginPanel } from "./components/LoginPanel";

import { clearAuth, loadAuth, onHubMessage, saveAuth, type AuthUser } from "./lib/auth";

const LAUNCHER_VERSION = "0.3.0";

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [online] = useState<boolean>(true);

  // Bootstrap auth from localStorage.
  useEffect(() => {
    const cached = loadAuth();
    if (cached) setUser(cached);
  }, []);

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
    <div className="app">
      <TopBar version={LAUNCHER_VERSION} online={online} />
      <Banner />
      <main className="main">
        <section className="left">
          <ProgramList loggedIn={user !== null} />
        </section>
        <section className="right">
          <LoginPanel user={user} onLogout={handleLogout} />
        </section>
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
