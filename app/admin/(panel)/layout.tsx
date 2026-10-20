import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { isAdminSession } from "@/lib/admin/request";

/** Every page under (panel) is only rendered for the logged-in admin. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminSession())) redirect("/admin/login");
  return (
    <div className="admin-shell">
      <header className="admin-top">
        <Link href="/admin" className="admin-brand">
          <img src="/brand/mark-on-dark.png" alt="" width={26} height={26} />
          aisolution <em>admin</em>
        </Link>
        <nav>
          <Link href="/admin">Maqolalar</Link>
          <Link href="/admin/new" className="admin-btn primary">
            + Yangi maqola
          </Link>
          <a href="/ru" target="_blank" rel="noreferrer">
            Saytni ochish ↗
          </a>
          <LogoutButton />
        </nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
