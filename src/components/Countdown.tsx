"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dict, Lang } from "@/lib/dictionaries";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown({ lang, dict, startsAt }: { lang: Lang; dict: Dict; startsAt: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(startsAt).getTime();
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  const s = left ?? 0;
  const cells = left === null
    ? ["--", "--", "--", "--"]
    : [String(Math.floor(s / 86400)), pad(Math.floor((s % 86400) / 3600)), pad(Math.floor((s % 3600) / 60)), pad(s % 60)];
  const labels = [dict.d, dict.h, dict.m, dict.s];

  return (
    <div className="cdband">
      <div className="wrap">
        <div className="cdtext">
          <div className="eyebrow">{dict.count_l}</div>
        </div>
        <div className="cdunits" role="timer" aria-label={dict.count_l}>
          {cells.map((v, i) => (
            <div key={i} className={`cdu${i === 3 ? " live" : ""}`}>
              <b key={v}>{v}</b>
              <span>{labels[i]}</span>
            </div>
          ))}
        </div>
        <Link className="btn" href={`/${lang}/register`}>
          {dict.cta1}
        </Link>
      </div>
    </div>
  );
}
