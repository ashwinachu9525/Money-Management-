import { getExpenses } from "@/actions/expenses";
import { AddExpenseDialog } from "@/components/dashboard/add-expense-dialog";
import { EditExpenseDialog } from "@/components/dashboard/edit-expense-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, ArrowDownRight, Calendar as CalendarIcon, Repeat } from "lucide-react";
import { format } from "date-fns";

import { MonthYearFilter } from "@/components/dashboard/month-year-filter";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawExpenses = await getExpenses();
  const expenses = JSON.parse(JSON.stringify(rawExpenses)) as any[];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isAllTime = resolvedSearchParams.filter === "all";
  const filterMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentMonth;
  const filterYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear;

  // Apply filter
  const filteredExpenses = isAllTime 
    ? expenses 
    : expenses.filter(exp => {
        const d = new Date(exp.date);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      });

  const totalExpense = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by category for the filtered period
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Monitor your spending and keep track of outgoing cash.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthYearFilter />
          <AddExpenseDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-rose-500 to-rose-700 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Expenses (All Time)</CardTitle>
            <Receipt className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-80 mt-1">Across {filteredExpenses.length} records</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAllTime ? "Average Monthly" : "Total for Period"}</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
              ₹{isAllTime 
                 ? (totalExpense / Math.max(1, new Set(expenses.map(e => `${new Date(e.date).getMonth()}-${new Date(e.date).getFullYear()}`)).size)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                 : totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAllTime ? "Average spend per active month" : "Total for selected period"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Receipt className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topCategory ? topCategory[0] : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {topCategory ? `₹${topCategory[1].toLocaleString("en-IN")} in period` : "No expenses yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Expense History</h3>
        
        {filteredExpenses.length > 0 ? (
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
            {/* Mobile card list */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 md:hidden">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{expense.category}</span>
                      {expense.isRecurring && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                          <Repeat className="h-3 w-3 mr-1" /> Recurring
                        </span>
                      )}
                    </div>
                    {expense.notes && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{expense.notes}</p>
                    )}
                    <span className="text-xs text-zinc-400 flex items-center mt-1">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-semibold text-rose-600 dark:text-rose-500 text-sm">
                      -₹{expense.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex gap-1">
                      <EditExpenseDialog expense={expense} />
                      <DeleteButton id={expense.id} itemType="Expense" />
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
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Notes</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{expense.category}</span>
                          {expense.isRecurring && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400">
                              <Repeat className="h-3 w-3 mr-1" /> Recurring
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {expense.notes || "-"}
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-2" />
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-500">
                        -₹{expense.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <EditExpenseDialog expense={expense} />
                          <DeleteButton id={expense.id} itemType="Expense" />
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
            <Receipt className="h-10 w-10 text-zinc-400 mb-4" />
            <h3 className="text-lg font-medium">No expense records</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              You haven't recorded any expenses yet. Keep track of where your money goes.
            </p>
            <AddExpenseDialog />
          </div>
        )}
      </div>
    </div>
  );
}
