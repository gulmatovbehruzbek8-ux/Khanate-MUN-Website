import Link from "next/link";
import type { Dict, Lang } from "@/lib/dictionaries";
import { site } from "@/content/site";

export default function Footer({ dict, lang }: { dict: Dict; lang: Lang }) {
  return (
    <footer>
      <div className="wrap">
        <div>
          <b style={{ color: "#fff" }}>KhanateMUN</b>
          <br />
          <span>{dict.foot}</span>
        </div>
        <div className="soc">
          <Link href={`/${lang}/faq`}>{dict.n_faq}</Link>
          <a href={site.social.telegram}>Telegram</a>
          <a href={site.social.instagram}>Instagram</a>
        </div>
      </div>
    </footer>
  );
}
