import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden md:block w-64 flex-shrink-0 z-20 sticky top-0 h-screen">
        <Sidebar />
      </aside>
      <div className="flex flex-col flex-1 w-full min-w-0 min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-32 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
