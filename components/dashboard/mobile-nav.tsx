"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, Receipt, Target, PlusCircle, BarChart4 } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Home",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Incomes",
    icon: Wallet,
    href: "/dashboard/incomes",
  },
  {
    label: "Add",
    icon: PlusCircle,
    href: "/dashboard/add",
    isAction: true,
  },
  {
    label: "Expenses",
    icon: Receipt,
    href: "/dashboard/expenses",
  },
  {
    label: "Goals",
    icon: Target,
    href: "/dashboard/goals",
  },
  {
    label: "Reports",
    icon: BarChart4,
    href: "/dashboard/reports",
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around pb-safe">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex flex-col items-center justify-center w-full py-3 px-2 text-xs font-medium transition-colors",
            pathname === route.href
              ? "text-blue-600 dark:text-blue-500"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          )}
        >
          {route.isAction ? (
            <div className="absolute -top-5 bg-blue-600 rounded-full p-3 shadow-lg border-4 border-white dark:border-zinc-950 text-white">
              <route.icon className="h-6 w-6" />
            </div>
          ) : (
            <>
              <route.icon className="h-5 w-5 mb-1" />
              <span>{route.label}</span>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
