import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MonthlyReportView } from "@/components/dashboard/monthly-report-view";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentDate = new Date();
  const month = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) - 1 : currentDate.getMonth();
  const year = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentDate.getFullYear();

  // Create date boundaries for the selected month
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Fetch data
  const incomes = await prisma.income.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const bills = await prisma.bill.findMany({
    where: {
      userId: session.user.id,
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // EMIs that are active during this month
  const emis = await prisma.eMI.findMany({
    where: {
      userId: session.user.id,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  // Consolidate into a single serialized array
  const transactions = [
    ...incomes.map(i => ({
      id: i.id,
      name: i.sourceName,
      amount: i.amount,
      date: i.date.toISOString(),
      type: "income" as const,
      category: i.category,
    })),
    ...expenses.map(e => ({
      id: e.id,
      name: e.notes || e.category,
      amount: e.amount,
      date: e.date.toISOString(),
      type: "expense" as const,
      category: e.category,
    })),
    ...bills.map(b => ({
      id: b.id,
      name: b.name,
      amount: b.amount,
      date: b.dueDate.toISOString(),
      type: "bill" as const,
    })),
    ...emis.map(emi => ({
      id: emi.id,
      name: emi.name,
      amount: emi.emiAmount,
      date: startDate.toISOString(), // Represented in the current month
      type: "emi" as const,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Monthly Reports</h1>
        <p className="text-muted-foreground">
          Analyze your income, expenses, and overall cashflow.
        </p>
      </div>
      
      <MonthlyReportView 
        transactions={transactions} 
        currentMonthDate={startDate.toISOString()} 
      />
    </div>
  );
}
