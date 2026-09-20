"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Dict, Lang } from "@/lib/dictionaries";

const pages = [
  { slug: "", key: "n_home" },
  { slug: "about", key: "n_about" },
  { slug: "seasons", key: "n_seasons" },
  { slug: "committees", key: "n_com" },
  { slug: "team", key: "n_team" },
  { slug: "register", key: "n_reg", mobileOnly: true },
] as const;

export default function Nav({ lang, dict }: { lang: Lang; dict: Dict }) {
  const pathname = usePathname() || `/${lang}`;
  const [open, setOpen] = useState(false);
  const current = pathname.split("/")[2] ?? "";
  const switchTo = (l: Lang) => pathname.replace(/^\/(en|uz)/, `/${l}`);

  const link = (p: (typeof pages)[number]) => (
    <Link
      key={p.slug}
      href={`/${lang}${p.slug ? `/${p.slug}` : ""}`}
      aria-current={current === p.slug ? "page" : undefined}
      onClick={() => setOpen(false)}
    >
      {dict[p.key]}
    </Link>
  );

  return (
    <nav>
      <div className="wrap">
        <Link className="brand" href={`/${lang}`}>
          <img alt="" src="/logo.jpg" width={38} height={38} />
          <span>KhanateMUN</span>
        </Link>
        <div className={`links${open ? " open" : ""}`} id="lk">
          {pages.filter((p) => !("mobileOnly" in p)).map(link)}
          <span className="mobonly">{pages.filter((p) => "mobileOnly" in p).map(link)}</span>
        </div>
        <div className="navr">
          <div className="lang" role="group" aria-label="Language">
            {(["en", "uz"] as Lang[]).map((l) => (
              <Link key={l} href={switchTo(l)} aria-pressed={l === lang} hrefLang={l} scroll={false}>
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
          <Link className="btn navcta" href={`/${lang}/register`}>
            {dict.cta1}
          </Link>
          <button
            className="burger"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
