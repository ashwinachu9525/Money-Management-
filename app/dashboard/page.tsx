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
import { IndianRupee, ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ExportButton } from "@/components/dashboard/export-btn";
import { format, subMonths } from "date-fns";
import { MonthYearFilter } from "@/components/dashboard/month-year-filter";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Fetch data — serialize to strip Prisma prototypes (prevents enqueueModel crash)
  const accounts = JSON.parse(JSON.stringify(
    await prisma.bankAccount.findMany({ where: { userId: session.user.id } })
  )) as any[];
  const incomes = JSON.parse(JSON.stringify(
    await prisma.income.findMany({ where: { userId: session.user.id }, orderBy: { date: "desc" } })
  )) as any[];
  const expenses = JSON.parse(JSON.stringify(
    await prisma.expense.findMany({ where: { userId: session.user.id }, orderBy: { date: "desc" } })
  )) as any[];

  // Calculate totals
  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isAllTime = resolvedSearchParams.filter === "all";
  const filterMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentMonth;
  const filterYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear;

  const thisMonthIncome = incomes
    .filter((i: any) => isAllTime || (new Date(i.date).getMonth() === filterMonth && new Date(i.date).getFullYear() === filterYear))
    .reduce((sum: number, i: any) => sum + i.amount, 0);
    
  const thisMonthExpense = expenses
    .filter((e: any) => isAllTime || (new Date(e.date).getMonth() === filterMonth && new Date(e.date).getFullYear() === filterYear))
    .reduce((sum: number, e: any) => sum + e.amount, 0);

  const remainingBalance = thisMonthIncome - thisMonthExpense; // Cashflow for the month

  // Prepare chart data (Last 6 months)
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const m = d.getMonth();
    const y = d.getFullYear();
    
    const inc = incomes.filter((inc: any) => new Date(inc.date).getMonth() === m && new Date(inc.date).getFullYear() === y).reduce((s: number, x: any) => s + x.amount, 0);
    const exp = expenses.filter((exp: any) => new Date(exp.date).getMonth() === m && new Date(exp.date).getFullYear() === y).reduce((s: number, x: any) => s + x.amount, 0);
    
    chartData.push({
      name: format(d, "MMM"),
      Income: inc,
      Expense: exp,
    });
  }

  // Prepare recent transactions
  const filteredIncomes = isAllTime ? incomes : incomes.filter((i: any) => new Date(i.date).getMonth() === filterMonth && new Date(i.date).getFullYear() === filterYear);
  const filteredExpenses = isAllTime ? expenses : expenses.filter((e: any) => new Date(e.date).getMonth() === filterMonth && new Date(e.date).getFullYear() === filterYear);

  const allTransactions = [
    ...filteredIncomes.map((i: any) => ({
      id: i.id,
      name: i.sourceName,
      amount: i.amount,
      date: i.date,
      type: "income" as const,
      category: i.category,
    })),
    ...filteredExpenses.map((e: any) => ({
      id: e.id,
      name: e.notes || e.category,
      amount: e.amount,
      date: e.date,
      type: "expense" as const,
      category: e.category,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "User"}. Here's your financial summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthYearFilter />
          <ExportButton />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Available Balance</CardTitle>
            <Wallet className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs opacity-80 mt-1">Across {accounts.length} accounts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAllTime ? "Total Income" : "Period Income"}</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
              ₹{thisMonthIncome.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAllTime ? "All time income" : format(new Date(filterYear, filterMonth), "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAllTime ? "Total Expense" : "Period Expense"}</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
              ₹{thisMonthExpense.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAllTime ? "All time expenses" : format(new Date(filterYear, filterMonth), "MMMM yyyy")}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAllTime ? "Total Cashflow" : "Period Cashflow"}</CardTitle>
            <IndianRupee className={`h-4 w-4 ${remainingBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Math.abs(remainingBalance).toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {remainingBalance >= 0 ? (isAllTime ? "Total saved" : "Saved in period") : (isAllTime ? "Total overspent" : "Overspent in period")}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Income vs Expense</CardTitle>
            <CardDescription>
              Your cash flow over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={chartData} />
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest financial activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={allTransactions} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
