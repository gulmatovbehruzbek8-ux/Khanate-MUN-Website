import fs from "node:fs";
import path from "node:path";
import { rowToRegistration, type Registration, type Settings, type Status, type Store } from "./types";

const file = path.join(process.cwd(), ".data", "dev-store.json");
type Data = { rows: string[][]; settings: Settings | null; content?: Record<string, string> };

function read(): Data {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Data;
  } catch {
    return { rows: [], settings: null };
  }
}
function write(d: Data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(d, null, 2));
}

export const devStore: Store = {
  kind: "dev",
  async append(row) {
    const d = read();
    d.rows.push(row);
    write(d);
  },
  async list(): Promise<Registration[]> {
    return read().rows.map((cells, i) => rowToRegistration(cells, i + 2));
  },
  async setStatus(row: number, status: Status) {
    const d = read();
    const r = d.rows[row - 2];
    if (!r) throw new Error("Row not found");
    while (r.length < 10) r.push("");
    r[9] = status;
    write(d);
  },
  async deleteRows(rows: number[]) {
    const d = read();
    const drop = new Set(rows);
    d.rows = d.rows.filter((_, i) => !drop.has(i + 2));
    write(d);
  },
  async clearRegistrations() {
    const d = read();
    d.rows = [];
    write(d);
  },
  async getSettings() {
    return read().settings;
  },
  async saveSettings(s) {
    const d = read();
    d.settings = s;
    write(d);
  },
  async getContent() {
    return read().content ?? {};
  },
  async setContent(key, value) {
    const d = read();
    d.content ??= {};
    if (value === null) delete d.content[key];
    else d.content[key] = value;
    write(d);
  },
};
