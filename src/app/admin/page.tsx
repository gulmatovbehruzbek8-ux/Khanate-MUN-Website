import AdminApp from "@/components/admin/AdminApp";
import AdminLogin from "@/components/admin/AdminLogin";
import { adminEnabled, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminEnabled()) {
    return (
      <main className="adm-center">
        <div className="adm-card">
          <h1>Admin is not set up</h1>
          <p>
            Add an <code>ADMIN_PASSWORD</code> environment variable (locally in <code>.env.local</code>, on Vercel in
            Settings &gt; Environment Variables), then reload this page.
          </p>
        </div>
      </main>
    );
  }
  if (!(await isAdmin())) return <AdminLogin />;

  const sheetId = process.env.GOOGLE_SHEET_ID;
  return <AdminApp sheetUrl={sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null} />;
}
