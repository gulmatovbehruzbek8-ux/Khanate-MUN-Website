import type { Dict } from "@/lib/dictionaries";
import { site } from "@/content/site";

export default function Footer({ dict }: { dict: Dict }) {
  return (
    <footer>
      <div className="wrap">
        <div>
          <b style={{ color: "#fff" }}>KhanateMUN</b>
          <br />
          <span>{dict.foot}</span>
        </div>
        <div className="soc">
          <a href={site.social.telegram}>Telegram</a>
          <a href={site.social.instagram}>Instagram</a>
        </div>
      </div>
    </footer>
  );
}
