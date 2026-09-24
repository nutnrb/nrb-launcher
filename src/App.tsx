import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { loadAuthToken, login as apiLogin, listPrograms, getWallet, type Program, type WalletData, setAuthToken } from "./api";
import {
  checkForUpdate,
  downloadAndInstallUpdate,
  getUpdateState,
  onUpdateError,
  onUpdateProgress,
  onUpdateInstalled,
  type UpdateState,
} from "./updater";

export default function App() {
  const [authed, setAuthed] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = loadAuthToken();
    if (token) {
      setAuthed(true);
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="empty">Loading…</div>;

  return authed ? (
    <Dashboard onLogout={() => { setAuthToken(null); setAuthed(false); }} />
  ) : (
    <Login onLogin={() => setAuthed(true)} />
  );
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await apiLogin(email, password);
      setAuthToken(result.token);
      onLogin();
    } catch (e: any) {
      setError(e.message || "ล็อกอินไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>NRB Launcher</h2>
        <input
          className="input"
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Updater state (current version, available version, progress, status).
  const [updateState, setUpdateState] = useState<UpdateState | null>(null);
  const [updatePercent, setUpdatePercent] = useState<number>(0);
  const [updateBusy, setUpdateBusy] = useState(false);

  useEffect(() => {
    Promise.all([listPrograms().catch((e) => { setError(e.message); return { programs: [] }; }), getWallet().catch(() => null)])
      .then(([p, w]) => {
        setPrograms(p.programs || []);
        setWallet(w);
      });
  }, []);

  // Subscribe to updater events (progress / installed / error) for the lifetime
  // of the dashboard; clean up on unmount.
  useEffect(() => {
    let unsubs: Array<() => void> = [];
    (async () => {
      const u1 = await onUpdateProgress((p) => setUpdatePercent(p.percent || 0));
      const u2 = await onUpdateInstalled(() => {
        // Backend calls app.restart() right after this event; nothing to do here.
      });
      const u3 = await onUpdateError((msg) => {
        setUpdateBusy(false);
        setError(`อัปเดตผิดพลาด: ${msg}`);
      });
      unsubs = [u1, u2, u3];
      // Seed initial state from cache (no network).
      try {
        setUpdateState(await getUpdateState());
      } catch {
        // ignore
      }
    })();
    return () => { unsubs.forEach((u) => u()); };
  }, []);

  // Manual "Check for updates" handler.
  const handleCheckUpdate = async () => {
    setUpdateBusy(true);
    setError(null);
    try {
      const s = await checkForUpdate();
      setUpdateState(s);
      if (s.available_version) {
        // Auto-download + install; backend emits progress + restart.
        await downloadAndInstallUpdate();
      } else {
        setUpdateBusy(false);
      }
    } catch (e: any) {
      setUpdateBusy(false);
      setError(e?.message || String(e));
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>NRB Launcher</h1>
        <div className="wallet-info">
          <span>เครดิต:</span>
          <span className="credits">{wallet ? Number(wallet.credits).toLocaleString() : "—"}</span>
        </div>
        <button className="btn btn-secondary" onClick={handleCheckUpdate} disabled={updateBusy}>
          {updateBusy
            ? `อัปเดต… ${Math.round(updatePercent)}%`
            : updateState?.available_version
                ? `อัปเดตเป็น v${updateState.available_version}`
                : "ตรวจสอบอัปเดต"}
        </button>
        <button className="btn btn-secondary" onClick={onLogout}>ออกจากระบบ</button>
      </header>

      <main className="main">
        {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="section-title">โปรแกรมของฉัน</div>
        {programs.length === 0 ? (
          <div className="empty">ยังไม่มีโปรแกรม — รอแอดมินเพิ่มใน Hub</div>
        ) : (
          <div className="program-grid">
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ProgramCard({ program }: { program: Program }) {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const handleInstall = async () => {
    if (!program.latestDownload) return;
    setBusy(true);
    setStatus("กำลังดาวน์โหลด…");
    setProgress(0);

    try {
      await invoke("download_and_install", {
        slug: program.slug,
        version: program.latestDownload.version,
        sha256: program.latestDownload.sha256,
        onProgress: (p: number) => setProgress(p),
      });
      setStatus("ติดตั้งสำเร็จ ✓");
      setProgress(100);
    } catch (e: any) {
      setStatus(`ผิดพลาด: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  const sizeMB = program.fileSize ? Math.round(Number(program.fileSize) / 1024 / 1024) : 0;

  return (
    <div className="program-card">
      <div className="program-name">
        <span>📦</span> {program.name}
      </div>
      <div className="program-desc">{program.description || "ไม่มีคำอธิบาย"}</div>
      <div className="program-meta">
        <span className="tag">v{program.latestVersion}</span>
        {sizeMB > 0 && <span className="tag">{sizeMB} MB</span>}
        {program.creditPerUse > 0 && <span className="tag">{program.creditPerUse} เครดิต/ครั้ง</span>}
        {program.requiresSubscription && <span className="tag">ต้องสมัคร</span>}
      </div>
      {busy && (
        <>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="status">{status}</div>
        </>
      )}
      {!busy && status && <div className="status">{status}</div>}
      <button
        className="btn btn-primary"
        onClick={handleInstall}
        disabled={busy || !program.latestDownload}
      >
        {busy ? "กำลังทำงาน…" : "ดาวน์โหลดและติดตั้ง"}
      </button>
    </div>
  );
}