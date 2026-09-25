// Announcements fetched from Hub API.

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "INFO" | "WARNING" | "MAINTENANCE" | "PROMO" | string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  createdAt: string;
  endAt: string | null;
  isRead: boolean;
}

interface AnnouncementsResponse {
  announcements?: Announcement[];
}

const HUB_BASE = "https://hub.nutnrb.com";

/**
 * Fetch active announcements from the Hub.
 * Returns [] on any error (offline, CORS, 404, malformed JSON, etc.).
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  try {
    const url = `${HUB_BASE}/api/v1/announcements?active=true`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as AnnouncementsResponse | Announcement[];
    if (Array.isArray(data)) return data as Announcement[];
    if (Array.isArray(data?.announcements)) return data.announcements;
    return [];
  } catch {
    return [];
  }
}
