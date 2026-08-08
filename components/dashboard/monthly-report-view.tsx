"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Printer, Wallet, Receipt, CreditCard, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type Transaction = {
  id: string;
  name: string;
  amount: number;
  date: string; // Serialized date
  type: "income" | "expense" | "bill" | "emi";
  category?: string;
};

interface MonthlyReportViewProps {
  transactions: Transaction[];
  currentMonthDate: string; // ISO string of the first day of the selected month
}

import { EmailReportButton } from "./email-report-btn";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function MonthlyReportView({ transactions, currentMonthDate }: MonthlyReportViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = new Date(currentMonthDate);

  const handlePrevMonth = () => {
    const prev = subMonths(date, 1);
    router.push(`/dashboard/reports?month=${prev.getMonth() + 1}&year=${prev.getFullYear()}`);
  };

  const handleNextMonth = () => {
    const next = addMonths(date, 1);
    router.push(`/dashboard/reports?month=${next.getMonth() + 1}&year=${next.getFullYear()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations
  const incomes = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');
  const bills = transactions.filter(t => t.type === 'bill');
  const emis = transactions.filter(t => t.type === 'emi');

  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalBills = bills.reduce((sum, t) => sum + t.amount, 0);
  const totalEMIs = emis.reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = totalExpense + totalBills + totalEMIs;
  const netSavings = totalIncome - totalOutflow;

  // Category Breakdown for Expenses
  const expensesByCategory = expenses.reduce((acc, curr) => {
    const cat = curr.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  // Overview Data (Income vs Outflow)
  const overviewData = [
    { name: "Income", amount: totalIncome, fill: "#10b981" },
    { name: "Expenses", amount: totalExpense, fill: "#ef4444" },
    { name: "Bills", amount: totalBills, fill: "#f59e0b" },
    { name: "EMIs", amount: totalEMIs, fill: "#3b82f6" },
  ];

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header Controls - Hidden in print */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold min-w-[150px] text-center">
            {format(date, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth} disabled={date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <EmailReportButton month={date.getMonth()} year={date.getFullYear()} />
          <Button onClick={handlePrint} variant="secondary" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-3xl font-bold">Monthly Financial Report</h1>
        <p className="text-xl text-gray-500">{format(date, "MMMM yyyy")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
              ₹{totalIncome.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Variable Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-500">
              ₹{totalExpense.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fixed Outflow (Bills & EMIs)</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
              ₹{(totalBills + totalEMIs).toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
        <Card className={`print:shadow-none print:border-gray-300 ${netSavings >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-rose-50 dark:bg-rose-950/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <PiggyBank className={`h-4 w-4 ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netSavings >= 0 ? 'text-emerald-700 dark:text-emerald-500' : 'text-rose-700 dark:text-rose-500'}`}>
              ₹{netSavings.toLocaleString("en-IN")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader>
            <CardTitle>Cashflow Breakdown</CardTitle>
            <CardDescription>Income vs different types of outflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={32}>
                    {overviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown of your variable expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[220px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    {/* Tooltip and Legend temporarily removed to prevent React 19 / Recharts hydration crash */}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No variable expenses recorded for this month.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed tables for print view (optional, but good for reports) */}
      <div className="hidden print:block mt-8 break-before-page">
        <h2 className="text-2xl font-bold mb-4">Detailed Breakdown</h2>
        {/* We can add a simple table here if needed, but summary charts usually suffice for a quick report */}
      </div>
    </div>
  );
}
