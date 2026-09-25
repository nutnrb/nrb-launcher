// NRB Launcher — programs catalog
// Two sections: LEGACY (always visible) + MEMBER (requires login)

export interface Program {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  version: string;
  sizeMB: number;
  requiresLogin: boolean;
  /** Asset URL for the .zip */
  downloadUrl: string;
  /** sha256 of the .zip (optional — backend will skip verify if empty) */
  sha256: string;
}

export const LEGACY_PROGRAMS: Program[] = [
  {
    slug: "nrb-backup-tool",
    name: "NRB Backup Tool",
    emoji: "💾",
    description: "เครื่องมือสำรองและกู้คืนข้อมูลระบบ — backup & restore for NRB workstations.",
    version: "2.4.1",
    sizeMB: 86,
    requiresLogin: false,
    downloadUrl:
      "https://github.com/nutnrb/nrb-backup-tool/releases/download/v2.4.1/nrb-backup-tool-2.4.1.zip",
    sha256: "",
  },
  {
    slug: "nrb-driver-pack",
    name: "NRB Driver Pack",
    emoji: "🖨️",
    description: "ชุดไดรเวอร์เครื่องพิมพ์และสแกนเนอร์สำหรับ Windows — bundled printer + scanner drivers.",
    version: "1.8.0",
    sizeMB: 142,
    requiresLogin: false,
    downloadUrl:
      "https://github.com/nutnrb/nrb-driver-pack/releases/download/v1.8.0/nrb-driver-pack-1.8.0.zip",
    sha256: "",
  },
];

export const MEMBER_PROGRAMS: Program[] = [
  {
    slug: "nrb-pos",
    name: "NRB POS",
    emoji: "🛒",
    description: "ระบบขายหน้าร้าน — point-of-sale สำหรับร้านค้าและร้านอาหาร.",
    version: "3.2.0",
    sizeMB: 124,
    requiresLogin: true,
    downloadUrl:
      "https://github.com/nutnrb/nrb-pos/releases/download/v3.2.0/nrb-pos-3.2.0.zip",
    sha256: "",
  },
  {
    slug: "nrb-accounting",
    name: "NRB Accounting",
    emoji: "📒",
    description: "ระบบบัญชีและภาษี — bookkeeping & tax filing for SMEs.",
    version: "2.0.1",
    sizeMB: 98,
    requiresLogin: true,
    downloadUrl:
      "https://github.com/nutnrb/nrb-accounting/releases/download/v2.0.1/nrb-accounting-2.0.1.zip",
    sha256: "",
  },
  {
    slug: "nrb-inventory",
    name: "NRB Inventory",
    emoji: "📦",
    description: "จัดการสต็อกสินค้าและคลัง — real-time stock across branches.",
    version: "1.6.0",
    sizeMB: 76,
    requiresLogin: true,
    downloadUrl:
      "https://github.com/nutnrb/nrb-inventory/releases/download/v1.6.0/nrb-inventory-1.6.0.zip",
    sha256: "",
  },
];

export const ALL_PROGRAMS: Program[] = [...LEGACY_PROGRAMS, ...MEMBER_PROGRAMS];

export function findProgram(slug: string): Program | undefined {
  return ALL_PROGRAMS.find((p) => p.slug === slug);
}
