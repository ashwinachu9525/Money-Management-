import { getBills, markBillAsPaid } from "@/actions/bills";
import { AddBillDialog } from "@/components/dashboard/add-bill-dialog";
import { EditBillDialog } from "@/components/dashboard/edit-bill-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Calendar as CalendarIcon, CheckCircle2, Clock, Zap } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { MonthYearFilter } from "@/components/dashboard/month-year-filter";

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawBills = await getBills();
  const bills = JSON.parse(JSON.stringify(rawBills)) as any[];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isAllTime = resolvedSearchParams.filter === "all";
  const filterMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentMonth;
  const filterYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear;

  const filteredBills = isAllTime 
    ? bills 
    : bills.filter(b => {
        const d = new Date(b.dueDate);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      });

  const pendingBills = filteredBills.filter(b => b.status === "PENDING");
  const paidBills = filteredBills.filter(b => b.status === "PAID");
  
  const totalPendingAmount = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upcoming Bills</h1>
          <p className="text-muted-foreground">
            Manage your utility bills and credit card payments.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthYearFilter />
          <AddBillDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-md lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Pending Amount</CardTitle>
            <Clock className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{totalPendingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-80 mt-1">{pendingBills.length} bills awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Clock className="mr-2 h-5 w-5 text-amber-500" /> Pending Bills
        </h3>
        
        {pendingBills.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingBills.map((bill) => {
              const isOverdue = isPast(new Date(bill.dueDate)) && !isToday(new Date(bill.dueDate));
              
              return (
                <Card key={bill.id} className={`relative overflow-hidden ${isOverdue ? 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20' : 'border-zinc-200 dark:border-zinc-800'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <Zap className={`h-5 w-5 ${isOverdue ? 'text-rose-500' : 'text-blue-500'}`} />
                        <CardTitle className="text-lg">{bill.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2 text-right">
                        <div className="text-lg font-bold">
                          ₹{bill.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="flex space-x-1">
                          <EditBillDialog bill={bill} />
                          <DeleteButton id={bill.id} itemType="Bill" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-sm">
                        <CalendarIcon className={`h-4 w-4 mr-2 ${isOverdue ? 'text-rose-500' : 'text-zinc-500'}`} />
                        <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-zinc-500'}>
                          Due {format(new Date(bill.dueDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      <form action={async () => {
                        "use server";
                        await markBillAsPaid(bill.id);
                      }}>
                        <Button size="sm" variant={isOverdue ? "destructive" : "default"} className="h-8">
                          Mark Paid
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-4" />
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You don't have any pending bills. You can relax now.
            </p>
          </div>
        )}
      </div>

      {paidBills.length > 0 && (
        <div className="mt-8 opacity-75">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" /> Paid Bills
          </h3>
          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
            {/* Mobile card list */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 md:hidden">
              {paidBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{bill.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-400 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {format(new Date(bill.dueDate), "MMM d, yyyy")}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                        Paid
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-semibold text-sm">₹{bill.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <div className="flex gap-1">
                      <EditBillDialog bill={bill} />
                      <DeleteButton id={bill.id} itemType="Bill" />
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
                    <th className="px-6 py-3 font-medium">Bill Name</th>
                    <th className="px-6 py-3 font-medium">Due Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {paidBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{bill.name}</td>
                      <td className="px-6 py-4 text-zinc-500">{format(new Date(bill.dueDate), "MMM d, yyyy")}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Paid
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        ₹{bill.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <EditBillDialog bill={bill} />
                          <DeleteButton id={bill.id} itemType="Bill" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
