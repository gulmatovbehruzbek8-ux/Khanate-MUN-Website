import AdminBar from "@/components/admin/AdminBar";
import AdminLogin from "@/components/admin/AdminLogin";
import TeamAdmin from "@/components/admin/TeamAdmin";
import { adminEnabled, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  if (!adminEnabled() || !(await isAdmin())) return <AdminLogin />;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  return (
    <div className="adm">
      <AdminBar sheetUrl={sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null} />
      <TeamAdmin />
    </div>
  );
}
