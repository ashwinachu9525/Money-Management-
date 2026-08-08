import { getIncomes } from "@/actions/incomes";
import { getBankAccounts } from "@/actions/bank-accounts";
import { AddIncomeDialog } from "@/components/dashboard/add-income-dialog";
import { EditIncomeDialog } from "@/components/dashboard/edit-income-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowUpRight, Calendar as CalendarIcon, Briefcase, Repeat, Landmark } from "lucide-react";
import { format } from "date-fns";
import { MonthYearFilter } from "@/components/dashboard/month-year-filter";

import { filterTransactionsForMonth } from "@/lib/utils";

export default async function IncomesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawIncomes = await getIncomes();
  const rawAccounts = await getBankAccounts();
  const incomes = JSON.parse(JSON.stringify(rawIncomes)) as any[];
  const accounts = JSON.parse(JSON.stringify(rawAccounts)) as any[];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isAllTime = resolvedSearchParams.filter === "all";
  const filterMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentMonth;
  const filterYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear;

  const filteredIncomes = filterTransactionsForMonth(incomes, filterMonth, filterYear, isAllTime);

  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);

  // Group by category for the filtered period
  const categoryTotals: Record<string, number> = {};
  filteredIncomes.forEach((inc) => {
    categoryTotals[inc.category] = (categoryTotals[inc.category] || 0) + inc.amount;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incomes</h1>
          <p className="text-muted-foreground">
            Track your revenue streams and manage your cash inflows.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthYearFilter />
          <AddIncomeDialog accounts={accounts} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Income (All Time)</CardTitle>
            <Wallet className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-80 mt-1">Across {filteredIncomes.length} records</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAllTime ? "Average Monthly" : "Total for Period"}</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
              ₹{isAllTime 
                 ? (totalIncome / Math.max(1, new Set(incomes.map(i => `${new Date(i.date).getMonth()}-${new Date(i.date).getFullYear()}`)).size)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                 : totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAllTime ? "Average income per active month" : "Total for selected period"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Transaction History</h3>
        
        {filteredIncomes.length > 0 ? (
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
            {/* Mobile card list */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 md:hidden">
              {filteredIncomes.map((income) => (
                <div key={income.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{income.sourceName}</p>
                    {income.companyName && (
                      <div className="flex items-center text-xs text-zinc-500 mt-0.5">
                        <Briefcase className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{income.companyName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                        {income.category}
                      </span>
                      {income.bankAccount && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                          <Landmark className="h-3 w-3 text-blue-500" />
                          {income.bankAccount.bankName} ({income.bankAccount.accountNick})
                        </span>
                      )}
                      {income.isRecurring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                          <Repeat className="h-3 w-3" /> Recurring
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {format(new Date(income.date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-500 text-sm">
                      +₹{income.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex gap-1">
                      <EditIncomeDialog income={income} accounts={accounts} />
                      <DeleteButton id={income.id} itemType="Income" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3 font-medium">Source / Company</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Bank Account</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredIncomes.map((income) => (
                    <tr key={income.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{income.sourceName}</div>
                        {income.companyName && (
                          <div className="flex items-center text-xs text-zinc-500 mt-1">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {income.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            {income.category}
                          </span>
                          {income.isRecurring && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                              <Repeat className="h-3 w-3" /> Recurring
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {income.bankAccount ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                            <Landmark className="h-3.5 w-3.5 text-blue-500" />
                            {income.bankAccount.bankName} ({income.bankAccount.accountNick})
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-2" />
                          {format(new Date(income.date), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-500">
                        +₹{income.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <EditIncomeDialog income={income} />
                          <DeleteButton id={income.id} itemType="Income" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <Wallet className="h-10 w-10 text-zinc-400 mb-4" />
            <h3 className="text-lg font-medium">No income records</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              You haven't recorded any income yet. Add your first income source to start tracking.
            </p>
            <AddIncomeDialog />
          </div>
        )}
      </div>
    </div>
  );
}
