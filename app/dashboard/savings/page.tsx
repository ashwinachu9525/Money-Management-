import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PiggyBank,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Building2,
  FileText,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { AddSavingDialog } from "@/components/dashboard/add-saving-dialog";
import { EditSavingDialog } from "@/components/dashboard/edit-saving-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { formatIndianCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default async function SavingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const rawSavings = await prisma.saving.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const savings = JSON.parse(JSON.stringify(rawSavings)) as any[];

  // Calculate statistics
  const totalCurrentValuation = savings.reduce((sum, s) => {
    const val = (s.currentValue !== null && s.currentValue !== undefined && s.currentValue > 0)
      ? s.currentValue
      : (s.totalInvestment || 0);
    return sum + val;
  }, 0);

  const totalInvested = savings.reduce((sum, s) => {
    const inv = (s.totalInvestment !== null && s.totalInvestment !== undefined && s.totalInvestment > 0)
      ? s.totalInvestment
      : (s.currentValue || 0);
    return sum + inv;
  }, 0);

  const monthlyCommitment = savings.reduce((sum, s) => {
    const amt = s.contributionAmount || 0;
    
    // Exclude EPF / Employee Provident Fund from monthly out-of-pocket commitments
    const isEPF = s.category?.toLowerCase().includes("epf") || s.category?.toLowerCase().includes("provident fund");
    if (isEPF || amt <= 0 || s.frequency === "ONE_TIME") return sum;

    switch (s.frequency) {
      case "MONTHLY":
        return sum + amt;
      case "QUARTERLY":
        return sum + amt / 3;
      case "HALF_YEARLY":
        return sum + amt / 6;
      case "YEARLY":
        return sum + amt / 12;
      default:
        return sum;
    }
  }, 0);

  // Only calculate gain/loss for items with explicit separate investment and current values
  const itemsWithGrowth = savings.filter((s) => s.totalInvestment > 0 && s.currentValue > 0 && s.totalInvestment !== s.currentValue);
  const totalGainLoss = itemsWithGrowth.reduce((sum, s) => sum + (s.currentValue! - s.totalInvestment!), 0);

  // Category breakdown
  const categoriesMap: Record<string, { count: number; total: number }> = {};
  savings.forEach((s) => {
    const cat = s.category || "Other";
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { count: 0, total: 0 };
    }
    const val = (s.currentValue !== null && s.currentValue !== undefined && s.currentValue > 0) ? s.currentValue : (s.totalInvestment || 0);
    categoriesMap[cat].count += 1;
    categoriesMap[cat].total += val;
  });

  const categoryList = Object.entries(categoriesMap).map(([name, data]) => ({
    name,
    ...data,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <PiggyBank className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            Savings & Investments
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your EPF, LIC policies, Kotak Future Secure, Stocks, Mutual Funds, FDs, and long-term savings.
          </p>
        </div>
        <AddSavingDialog />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Portfolio Value */}
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Portfolio Value</CardTitle>
            <TrendingUp className="h-5 w-5 opacity-85" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">
              {formatIndianCurrency(totalCurrentValuation)}
            </div>
            <div className="flex items-center gap-1.5 text-xs opacity-90 mt-1">
              <span>Invested: {formatIndianCurrency(totalInvested)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Estimated Gain/Loss */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimated Value Growth</CardTitle>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {totalGainLoss >= 0 ? "+" : ""}{formatIndianCurrency(totalGainLoss)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalGainLoss >= 0 ? "Unrealized gain across investments" : "Unrealized loss across investments"}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Monthly Commitment */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings Commitment</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatIndianCurrency(monthlyCommitment)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Annual: {formatIndianCurrency(monthlyCommitment * 12)}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Active Policies */}
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Policies & Plans</CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savings.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {categoryList.length} savings categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Summary */}
      {categoryList.length > 0 && (
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Investment Category Allocation</CardTitle>
            <CardDescription>Overview of your savings distributed across LIC, Kotak plans, Mutual Funds, FDs, and Stocks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryList.map((cat) => (
                <div
                  key={cat.name}
                  className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-muted-foreground truncate">{cat.name}</span>
                  <div className="mt-2">
                    <span className="text-sm font-bold block">{formatIndianCurrency(cat.total)}</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{cat.count} {cat.count === 1 ? "plan" : "plans"}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings & Investments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Your Savings & Policies ({savings.length})</h2>
        </div>

        {savings.length === 0 ? (
          <Card className="p-8 text-center border-dashed border-zinc-300 dark:border-zinc-800">
            <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <h3 className="text-lg font-semibold">No Savings or Investments Added Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              Start tracking your LIC policy, Kotak Future Secure, Mutual Fund SIPs, Stocks, FDs, and PPF savings options.
            </p>
            <AddSavingDialog />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savings.map((item: any) => {
              const freqLabel =
                item.frequency === "MONTHLY"
                  ? "Monthly"
                  : item.frequency === "QUARTERLY"
                  ? "Quarterly"
                  : item.frequency === "HALF_YEARLY"
                  ? "Half-Yearly"
                  : item.frequency === "YEARLY"
                  ? "Yearly"
                  : "One-Time";

              const hasGrowth = item.currentValue && item.currentValue > item.totalInvestment;

              return (
                <Card key={item.id} className="relative flex flex-col justify-between shadow-sm border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 mb-1.5">
                          {item.category}
                        </span>
                        <CardTitle className="text-base font-bold line-clamp-1">{item.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <EditSavingDialog saving={item} />
                        <DeleteButton id={item.id} itemType="Saving" />
                      </div>
                    </div>

                    {(item.institution || item.policyNumber) && (
                      <CardDescription className="flex items-center gap-2 text-xs mt-1">
                        {item.institution && (
                          <span className="flex items-center gap-1 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                            {item.institution}
                          </span>
                        )}
                        {item.policyNumber && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <FileText className="h-3.5 w-3.5 text-zinc-400" />
                            #{item.policyNumber}
                          </span>
                        )}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          {item.contributionAmount > 0 && item.frequency !== "ONE_TIME" ? "Periodic Premium" : "Contribution Type"}
                        </span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.contributionAmount > 0 && item.frequency !== "ONE_TIME" ? (
                            <>
                              {formatIndianCurrency(item.contributionAmount)}
                              <span className="text-[10px] font-normal text-muted-foreground"> ({freqLabel})</span>
                            </>
                          ) : (
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Accumulated / One-Time</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Total Balance / Corpus</span>
                        <span className="font-semibold">{formatIndianCurrency(item.totalInvestment || item.currentValue || 0)}</span>
                      </div>
                    </div>

                    {item.currentValue && item.totalInvestment > 0 && item.currentValue !== item.totalInvestment && (
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-muted-foreground">Current Valuation:</span>
                        <span className={`font-bold flex items-center gap-0.5 ${hasGrowth ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                          {formatIndianCurrency(item.currentValue)}
                          {hasGrowth && <ArrowUpRight className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Start: {format(new Date(item.startDate), "MMM yyyy")}
                      </span>
                      {item.maturityDate && (
                        <span>
                          Maturity: {format(new Date(item.maturityDate), "MMM yyyy")}
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2 pt-1">
                        "{item.notes}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
