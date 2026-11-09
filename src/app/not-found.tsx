import Link from "next/link";
import "./globals.css";

export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <main className="inner" style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div className="wrap">
            <div className="eyebrow">404</div>
            <h2>Page Not Found</h2>
            <p style={{ margin: "16px 0 24px" }}>The page you are looking for does not exist or has been moved.</p>
            <div>
              <Link className="btn" href="/en">
                Return to Home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
