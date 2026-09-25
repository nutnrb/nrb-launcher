// ProgramCard — status dot + install/launch + locked overlay.
import { useEffect, useState } from "react";
import { Download, Lock, Play, RefreshCw } from "lucide-react";
import {
  checkProgramInstalled,
  downloadProgram,
  getProgramsDir,
  launchProgram,
  onDownloadProgress,
  readLicenseStatus,
  type DownloadProgress,
  type LicenseInfo,
} from "../lib/tauri";
import { toast } from "sonner";
import type { Program } from "../lib/programs";

export interface ProgramCardProps {
  program: Program;
  loggedIn: boolean;
}

type InstallState = "unknown" | "not-installed" | "installed";
type Action = "idle" | "downloading" | "launching";

export function ProgramCard({ program, loggedIn }: ProgramCardProps) {
  const [installState, setInstallState] = useState<InstallState>("unknown");
  const [license, setLicense] = useState<LicenseInfo>({ status: "unknown" });
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [action, setAction] = useState<Action>("idle");
  const [exePath, setExePath] = useState<string | null>(null);

  const locked = program.requiresLogin && !loggedIn;

  // Probe install + license state.
  useEffect(() => {
    if (locked) return;
    let alive = true;
    (async () => {
      try {
        const installed = await checkProgramInstalled(program.slug);
        if (!alive) return;
        setInstallState(installed ? "installed" : "not-installed");
        if (installed) {
          const lic = await readLicenseStatus(program.slug);
          if (!alive) return;
          setLicense(lic);
          try {
            const dir = await getProgramsDir();
            setExePath(`${dir}\\${program.slug}\\${program.slug}.exe`);
          } catch {
            /* noop */
          }
        }
      } catch (e) {
        // Backend command may not exist yet — degrade gracefully.
        console.warn("probe failed", e);
        setInstallState("not-installed");
      }
    })();
    return () => {
      alive = false;
    };
  }, [program.slug, locked]);

  // Live download progress.
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      try {
        unlisten = await onDownloadProgress((p) => {
          if (p.slug !== program.slug) return;
          setProgress(p);
        });
      } catch {
        /* noop */
      }
    })();
    return () => {
      if (unlisten) unlisten();
    };
  }, [program.slug]);

  async function handleInstall() {
    if (action !== "idle") return;
    setAction("downloading");
    setProgress({
      slug: program.slug,
      version: program.version,
      downloaded: 0,
      total: program.sizeMB * 1024 * 1024,
      percent: 0,
      stage: "downloading",
    });
    try {
      const result = await downloadProgram({
        slug: program.slug,
        version: program.version,
        sha256: program.sha256,
        downloadUrl: program.downloadUrl,
      });
      setExePath(`${result.installPath}\\${program.slug}.exe`);
      setInstallState("installed");
      const lic = await readLicenseStatus(program.slug);
      setLicense(lic);
      toast.success(`${program.name} ติดตั้งเรียบร้อย`, {
        description: `v${program.version}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`ดาวน์โหลดไม่สำเร็จ: ${msg}`);
    } finally {
      setAction("idle");
      setTimeout(() => setProgress(null), 1500);
    }
  }

  async function handleLaunch() {
    if (!exePath) {
      toast.error("ยังไม่พบไฟล์โปรแกรม — ลองดาวน์โหลดใหม่อีกครั้ง");
      return;
    }
    setAction("launching");
    try {
      await launchProgram(exePath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`เปิดโปรแกรมไม่สำเร็จ: ${msg}`);
    } finally {
      setAction("idle");
    }
  }

  // Visual state.
  let dotClass = "gray";
  let dotTitle = "ยังไม่ได้ติดตั้ง";
  if (installState === "installed") {
    if (license.status === "licensed") {
      dotClass = "green";
      dotTitle = "ติดตั้งแล้ว + มี license";
    } else {
      dotClass = "red";
      dotTitle = "ติดตั้งแล้ว + ไม่มี license";
    }
  }

  const showProgress = action === "downloading" && progress !== null;

  return (
    <div className={`program-card${locked ? " locked" : ""}`}>
      <div className="program-card-head">
        <span className="program-emoji" aria-hidden>
          {program.emoji}
        </span>
        <div className="program-name">{program.name}</div>
        <span
          className={`status-dot ${dotClass}`}
          title={dotTitle}
          aria-label={dotTitle}
        />
      </div>
      <div className="program-desc">{program.description}</div>
      <div className="program-meta">
        <span className="tag">v{program.version}</span>
        <span className="tag">{program.sizeMB} MB</span>
        {program.requiresLogin && <span className="tag">Member</span>}
        {license.expiresAt && (
          <span className="tag">หมดอายุ {license.expiresAt}</span>
        )}
      </div>

      {showProgress && (
        <>
          <div className="progress" aria-label="Download progress">
            <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="status-text">
            {progress.stage === "downloading" &&
              `กำลังดาวน์โหลด… ${progress.percent}%`}
            {progress.stage === "verifying" && "กำลังตรวจสอบไฟล์…"}
            {progress.stage === "extracting" && "กำลังแตกไฟล์…"}
            {progress.stage === "done" && "เสร็จสิ้น ✓"}
            {progress.stage === "error" && (progress.message ?? "ผิดพลาด")}
          </div>
        </>
      )}

      {!showProgress && installState === "installed" && license.status === "unlicensed" && (
        <div className="status-text" style={{ color: "var(--danger)" }}>
          ⚠ ไม่มี license — กรุณาติดต่อแอดมิน
        </div>
      )}

      {!locked && installState !== "installed" && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleInstall}
          disabled={action !== "idle"}
        >
          {action === "downloading" ? (
            <>
              <RefreshCw size={14} className="spin" />
              กำลังติดตั้ง…
            </>
          ) : (
            <>
              <Download size={14} />
              ดาวน์โหลด
            </>
          )}
        </button>
      )}

      {!locked && installState === "installed" && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleLaunch}
          disabled={action === "launching"}
        >
          {action === "launching" ? (
            <>
              <RefreshCw size={14} className="spin" />
              กำลังเปิด…
            </>
          ) : (
            <>
              <Play size={14} />
              เปิดโปรแกรม
            </>
          )}
        </button>
      )}

      {!locked && installState === "unknown" && (
        <button type="button" className="btn btn-ghost" disabled>
          กำลังตรวจสอบ…
        </button>
      )}

      {locked && (
        <div className="locked-overlay">
          <span className="locked-overlay-icon">
            <Lock size={22} />
          </span>
          <span>เข้าสู่ระบบเพื่อปลดล็อก</span>
        </div>
      )}
    </div>
  );
}
