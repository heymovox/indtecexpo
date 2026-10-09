import type { ReactNode } from "react";
import { adminConfig } from "@/config/admin";
import { AdminShell } from "./AdminShell";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? adminConfig.defaultEmail;
  return <AdminShell adminEmail={adminEmail}>{children}</AdminShell>;
}
