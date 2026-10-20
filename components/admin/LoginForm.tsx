"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setPassword("");
    setError(
      response?.status === 429
        ? "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring."
        : response?.status === 401
          ? "Parol noto'g'ri."
          : "Kirib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."
    );
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <label htmlFor="admin-password">Parol</label>
      <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="admin-btn primary" type="submit" disabled={busy || !password}>
        {busy ? "Tekshirilmoqda…" : "Kirish"}
      </button>
    </form>
  );
}
