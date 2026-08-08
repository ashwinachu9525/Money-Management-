"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  CreditCard,
  Target,
  PiggyBank,
  Sparkles,
  Settings,
  BarChart4,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Incomes",
    icon: Wallet,
    href: "/dashboard/incomes",
  },
  {
    label: "Expenses",
    icon: Receipt,
    href: "/dashboard/expenses",
  },
  {
    label: "EMI & Loans",
    icon: Landmark,
    href: "/dashboard/emi",
  },
  {
    label: "Credit Cards",
    icon: CreditCard,
    href: "/dashboard/credit-cards",
  },
  {
    label: "Bills",
    icon: Receipt,
    href: "/dashboard/bills",
  },
  {
    label: "Bank Accounts",
    icon: PiggyBank,
    href: "/dashboard/accounts",
  },
  {
    label: "Goals",
    icon: Target,
    href: "/dashboard/goals",
  },
  {
    label: "Savings & Policies",
    icon: PiggyBank,
    href: "/dashboard/savings",
  },
  {
    label: "AI Insights",
    icon: Sparkles,
    href: "/dashboard/insights",
  },
  {
    label: "Reports",
    icon: BarChart4,
    href: "/dashboard/reports",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Money Management
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition",
                pathname === route.href
                  ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", pathname === route.href ? "text-blue-600 dark:text-blue-500" : "")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-auto px-3 py-2">
        <Link
          href="/dashboard/settings"
          className={cn(
            "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition",
            pathname === "/dashboard/settings"
              ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
              : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          <div className="flex items-center flex-1">
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </div>
        </Link>
      </div>
    </div>
  );
}
