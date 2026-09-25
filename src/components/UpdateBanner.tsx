// UpdateBanner — one-click in-app updater.
// On mount, asks the Tauri updater plugin whether a newer version is
// available. If yes, shows a banner with a "อัปเดตเลย" button that
// streams download progress and then relaunches the app to apply.
import { check } from "@tauri-apps/plugin-updater";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type UpdateInfo = Awaited<ReturnType<typeof check>>;

export function UpdateBanner() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [version, setVersion] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const u = await check();
        if (!alive) return;
        if (u?.available) {
          setUpdate(u);
          setVersion(u.version ?? "");
          setNotes(u.body ?? "");
        }
      } catch (e) {
        // Silent — update checks are best-effort.
        console.warn("Update check failed:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!update || dismissed) return null;

  const install = async () => {
    setDownloading(true);
    setProgress(0);
    try {
      let downloaded = 0;
      let contentLength = 0;
      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            setProgress(0);
            break;
          case "Progress":
            downloaded += event.data.chunkLength ?? 0;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case "Finished":
            setProgress(100);
            break;
        }
      });
      // On Windows, downloadAndInstall exits the app to apply the update.
      // On macOS/Linux, the caller should relaunch manually.
    } catch (e) {
      console.error("Update install failed:", e);
      setDownloading(false);
    }
  };

  const notesPreview =
    notes && notes.length > 0
      ? notes.slice(0, 80) + (notes.length > 80 ? "…" : "")
      : "มีการปรับปรุงใหม่";

  return (
    <div
      className="glass p-3 flex items-center gap-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(0, 180, 255, 0.15), rgba(0, 180, 255, 0.05))",
        borderColor: "var(--primary)",
      }}
      role="status"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--primary)" }}
      >
        <Download size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">อัปเดตใหม่พร้อมใช้งาน</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {downloading
            ? `กำลังดาวน์โหลด... ${progress}%`
            : `อัปเดตเป็น v${version} มั้ย? (${notesPreview})`}
        </p>
        {downloading && (
          <div
            className="mt-1.5 h-1 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full transition-all"
              style={{
                width: `${progress}%`,
                background: "var(--primary)",
              }}
            />
          </div>
        )}
      </div>
      {!downloading && (
        <>
          <button onClick={install} className="btn btn-primary !text-xs">
            <Download size={14} /> อัปเดตเลย
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="titlebar-btn"
            aria-label="Dismiss update banner"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}
