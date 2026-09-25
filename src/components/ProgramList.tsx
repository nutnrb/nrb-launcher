// ProgramList — search + 2 sections (Legacy / Member).
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProgramCard } from "./ProgramCard";
import { LEGACY_PROGRAMS, MEMBER_PROGRAMS, type Program } from "../lib/programs";

export interface ProgramListProps {
  loggedIn: boolean;
}

function filterPrograms(list: Program[], query: string): Program[] {
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q),
  );
}

export function ProgramList({ loggedIn }: ProgramListProps) {
  const [q, setQ] = useState("");

  const legacy = useMemo(() => filterPrograms(LEGACY_PROGRAMS, q), [q]);
  const member = useMemo(() => filterPrograms(MEMBER_PROGRAMS, q), [q]);
  const totalShown = legacy.length + member.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="search">
        <span className="search-icon">
          <Search size={16} />
        </span>
        <input
          className="search-input"
          type="search"
          placeholder="ค้นหาโปรแกรม…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search programs"
        />
      </div>

      {totalShown === 0 && (
        <div className="empty">ไม่พบโปรแกรมที่ตรงกับ "{q}"</div>
      )}

      {legacy.length > 0 && (
        <section>
          <div className="section-title">Legacy · ดาวน์โหลดได้ทันที</div>
          <div className="program-grid" style={{ marginTop: 10 }}>
            {legacy.map((p) => (
              <ProgramCard key={p.slug} program={p} loggedIn={loggedIn} />
            ))}
          </div>
        </section>
      )}

      {member.length > 0 && (
        <section>
          <div className="section-title">
            Member · {loggedIn ? "ปลดล็อกแล้ว" : "ต้องเข้าสู่ระบบ"}
          </div>
          <div className="program-grid" style={{ marginTop: 10 }}>
            {member.map((p) => (
              <ProgramCard key={p.slug} program={p} loggedIn={loggedIn} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
