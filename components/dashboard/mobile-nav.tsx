"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Target,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FullMobileMenu } from "@/components/dashboard/full-mobile-menu";

const primaryRoutes = [
  {
    label: "Home",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Expenses",
    icon: Receipt,
    href: "/dashboard/expenses",
  },
  {
    label: "Cards",
    icon: CreditCard,
    href: "/dashboard/credit-cards",
  },
  {
    label: "Goals",
    icon: Target,
    href: "/dashboard/goals",
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <FullMobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-stretch justify-around h-16">
          {primaryRoutes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-medium transition-colors px-1",
                  isActive
                    ? "text-blue-600 dark:text-blue-500 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                )}
              >
                <route.icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "")} />
                <span>{route.label}</span>
              </Link>
            );
          })}

          {/* Full Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-[10px] font-medium transition-colors px-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            aria-label="Open full menu"
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
