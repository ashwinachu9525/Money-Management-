"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Landmark,
  CreditCard,
  PiggyBank,
  Target,
  Sparkles,
  BarChart4,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const allRoutes = [
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
    label: "AI Insights",
    icon: Sparkles,
    href: "/dashboard/insights",
  },
  {
    label: "Reports",
    icon: BarChart4,
    href: "/dashboard/reports",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

interface FullMobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FullMobileMenu({ open, onOpenChange }: FullMobileMenuProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />

      {/* Slide-out Panel */}
      <div className="relative flex flex-col w-5/6 max-w-xs bg-white dark:bg-zinc-950 h-full shadow-2xl z-50 border-r border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <span className="font-bold text-base tracking-tight">Money Manager</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close Menu"
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info card */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center text-sm">
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold truncate">{session?.user?.name || "User"}</span>
            <span className="text-xs text-muted-foreground truncate">{session?.user?.email || ""}</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu Navigation
          </div>
          {allRoutes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-50"
                )}
              >
                <route.icon className={cn("h-5 w-5", isActive ? "text-blue-600 dark:text-blue-400" : "")} />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="outline"
            className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:border-zinc-800"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
