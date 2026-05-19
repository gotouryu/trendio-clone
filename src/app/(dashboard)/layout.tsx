import Sidebar from "@/components/Sidebar";
import AppShellExtras from "@/components/AppShellExtras";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pt-14 lg:pt-0 dark:text-gray-100">
        {children}
      </main>
      <AppShellExtras />
    </div>
  );
}
