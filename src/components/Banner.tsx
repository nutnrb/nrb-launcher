// Banner — dismissible announcements fetched from the Hub.
import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { fetchAnnouncements, type Announcement } from "../lib/announcements";

const DISMISSED_KEY = "nrb.banner.dismissed.v1";

function pickBanner(list: Announcement[]): Announcement | null {
  // Prefer HIGH / URGENT, then most recent.
  const sorted = [...list].sort((a, b) => {
    const aHigh = a.priority === "URGENT" || a.priority === "HIGH" ? 1 : 0;
    const bHigh = b.priority === "URGENT" || b.priority === "HIGH" ? 1 : 0;
    if (aHigh !== bHigh) return bHigh - aHigh;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return sorted[0] ?? null;
}

function readDismissed(): { id?: string; until?: number } {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as { id?: string; until?: number };
  } catch {
    return {};
  }
}

export function Banner() {
  const [a, setA] = useState<Announcement | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchAnnouncements();
      if (!alive) return;
      setA(pickBanner(list));
    })();
    const d = readDismissed();
    setDismissedId(d.id ?? null);
    return () => {
      alive = false;
    };
  }, []);

  if (!a) return null;
  if (dismissedId === a.id) return null;

  const dismiss = () => {
    setDismissedId(a.id);
    try {
      localStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify({ id: a.id, until: Date.now() + 24 * 60 * 60 * 1000 }),
      );
    } catch {
      /* noop */
    }
  };

  return (
    <div className="banner" role="status">
      <span className="banner-icon">
        <Megaphone size={20} />
      </span>
      <div className="banner-body">
        <div className="banner-title">{a.title}</div>
        <div className="banner-message">{a.content}</div>
      </div>
      <button type="button" className="banner-close" onClick={dismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
