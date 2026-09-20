"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (res?.ok) {
      location.reload();
      return;
    }
    setBusy(false);
    setError(res?.status === 429 ? "Too many attempts. Wait a few minutes." : "Wrong password.");
  }

  return (
    <main className="adm-center">
      <form className="adm-card" onSubmit={submit}>
        <img src="/logo.jpg" alt="" width={56} height={56} style={{ borderRadius: "50%" }} />
        <h1>KhanateMUN Admin</h1>
        <label htmlFor="password">
          <span>Password</span>
          <input id="password" name="password" type="password" required autoFocus autoComplete="current-password" />
        </label>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Sign in"}
        </button>
        {error && <div className="err" role="alert">{error}</div>}
      </form>
    </main>
  );
}
