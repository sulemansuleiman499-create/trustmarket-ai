import { AppShell } from "@/components/layout/app-shell";

/**
 * Dashboard shell layout: renders the responsive sidebar/topbar around
 * every dashboard section. Pages inside are server components.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
