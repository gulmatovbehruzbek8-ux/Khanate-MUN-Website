export const STATUSES = ["New", "Accepted", "Paid", "Rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const HEADERS = [
  "Time", "Name", "School", "Telegram", "Ticket", "Fee (UZS)", "Committee", "Referral", "Language", "Status",
];

export type Registration = {
  row: number; // spreadsheet row number (first data row is 2)
  time: string;
  name: string;
  school: string;
  telegram: string;
  ticket: string;
  fee: number;
  committee: string;
  referral: string; // the referral code this person entered (someone else's code)
  code?: string; // this person's own referral code (added by the admin API)
  lang: string;
  status: string;
};

export type Settings = {
  nextSeasonStart: string | null;
  registrationOpen: boolean;
  feeDelegate: number; // UZS
  feeObserver: number; // UZS
};

export interface Store {
  kind: "sheets" | "dev";
  append(row: string[]): Promise<void>;
  list(): Promise<Registration[]>;
  setStatus(row: number, status: Status): Promise<void>;
  /** Deletes registrations by spreadsheet row number. */
  deleteRows(rows: number[]): Promise<void>;
  /** Deletes every registration (keeps the header row). */
  clearRegistrations(): Promise<void>;
  getSettings(): Promise<Settings | null>;
  saveSettings(s: Settings): Promise<void>;
  /** Small key/value documents edited from the admin panel (e.g. season details as JSON). */
  getContent(): Promise<Record<string, string>>;
  setContent(key: string, value: string | null): Promise<void>;
}

export function rowToRegistration(cells: string[], row: number): Registration {
  const c = (i: number) => cells[i] ?? "";
  return {
    row,
    time: c(0), name: c(1), school: c(2), telegram: c(3), ticket: c(4),
    fee: Number(c(5)) || 0,
    committee: c(6), referral: c(7), lang: c(8), status: c(9) || "New",
  };
}

