"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  BarChart4,
  CreditCard,
  PiggyBank,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Home",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Income",
    icon: Wallet,
    href: "/dashboard/incomes",
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 safe-area-inset-bottom">
      <div className="flex items-stretch justify-around h-16">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-medium transition-colors px-1",
                isActive
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              )}
            >
              <route.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "")} />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
