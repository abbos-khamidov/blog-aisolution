import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { readAdminConfig } from "@/lib/admin/auth";
import { isAdminSession } from "@/lib/admin/request";

export default async function AdminLoginPage() {
  if (await isAdminSession()) redirect("/admin");
  const configured = readAdminConfig() !== null;
  return (
    <main className="admin-login">
      <div className="admin-card">
        <img src="/brand/mark-on-dark.png" alt="" width={40} height={40} />
        <h1>Admin panel</h1>
        {configured ? (
          <LoginForm />
        ) : (
          <p className="admin-note">
            Admin panel serverda sozlanmagan. <code>.env</code> fayliga <code>ADMIN_PASSWORD_HASH</code> va <code>ADMIN_SESSION_SECRET</code> qo&apos;shing.
          </p>
        )}
      </div>
    </main>
  );
}
