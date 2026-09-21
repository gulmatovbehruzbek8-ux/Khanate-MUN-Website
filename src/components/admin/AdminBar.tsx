"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminBar({ sheetUrl }: { sheetUrl: string | null }) {
  const path = usePathname();
  const tabs = [
    { href: "/admin", label: "Registrations", on: path === "/admin" },
    { href: "/admin/seasons", label: "Seasons", on: path.startsWith("/admin/seasons") },
    { href: "/admin/team", label: "Team", on: path.startsWith("/admin/team") },
  ];

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.reload();
  }

  return (
    <header className="adm-bar">
      <div className="wrap">
        <div className="adm-brand">
          <img src="/logo.jpg" alt="" width={32} height={32} />
          <b>KhanateMUN Admin</b>
        </div>
        <div className="adm-tabs" role="navigation" aria-label="Admin sections">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={t.on ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </div>
        <div className="adm-actions">
          {sheetUrl && (
            <a className="btn ghost" href={sheetUrl} target="_blank" rel="noreferrer">
              Open Google Sheet
            </a>
          )}
          <button className="btn ghost" onClick={logout}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
