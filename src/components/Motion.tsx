"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Things that fade and rise into view as you scroll. Anything already on screen is left alone,
// so nothing flashes and the page is fully visible without JavaScript.
const TARGETS = ".head,.facts,.fact,.tile,.com,.person,.fees,.perks,.reg form,.reg > div,.gallery > *,.cover,.faq details,.season-bar,.subhead,.agenda,.detail,.meta,.moments .cta,.qa .wrap > *,.list > *,.cdband .wrap > *";

export default function Motion() {
  const path = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const vh = window.innerHeight;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    const seen = new Map<Element, number>();
    document.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
      if (el.closest("nav,footer,.hero,.lb") || el.classList.contains("in")) return;
      if (el.getBoundingClientRect().top < vh * 0.92) return; // already visible on load
      const parent = el.parentElement!;
      const i = seen.get(parent) ?? 0;
      seen.set(parent, i + 1);
      el.style.setProperty("--d", `${Math.min(i, 5) * 70}ms`);
      el.classList.add("rv");
      io.observe(el);
    });
    return () => io.disconnect();
  }, [path]);

  return null;
}
