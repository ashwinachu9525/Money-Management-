import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MonthlyReportView } from "@/components/dashboard/monthly-report-view";
import { filterTransactionsForMonth } from "@/lib/utils";

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

  // Fetch data - including recurring entries created on or before this month
  const rawIncomes = await prisma.income.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { date: { gte: startDate, lte: endDate } },
        { isRecurring: true, date: { lte: endDate } }
      ]
    },
  });

  const rawExpenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { date: { gte: startDate, lte: endDate } },
        { isRecurring: true, date: { lte: endDate } }
      ]
    },
  });

  const incomes = filterTransactionsForMonth(
    JSON.parse(JSON.stringify(rawIncomes)),
    month,
    year,
    false
  );

  const expenses = filterTransactionsForMonth(
    JSON.parse(JSON.stringify(rawExpenses)),
    month,
    year,
    false
  );

  const bills = await prisma.bill.findMany({
    where: {
      userId: session.user.id,
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // EMIs & Pre-EMIs active during this month
  const emis = await prisma.eMI.findMany({
    where: {
      userId: session.user.id,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    include: {
      slabs: true,
    },
  });

  // Credit card statements for the month
  const creditCardStatements = await prisma.creditCardStatement.findMany({
    where: {
      creditCard: {
        userId: session.user.id,
      },
      month: month + 1, // month is 0-indexed in JS, but we store 1-12 in DB
      year: year,
    },
    include: {
      creditCard: true,
    },
  });

  // Consolidate into a single serialized array safely
  const transactions = [
    ...incomes.map(i => ({
      id: i.id,
      name: i.sourceName,
      amount: i.amount,
      date: typeof i.date === "string" ? i.date : new Date(i.date).toISOString(),
      type: "income" as const,
      category: i.category,
    })),
    ...expenses.map(e => ({
      id: e.id,
      name: e.notes || e.category,
      amount: e.amount,
      date: typeof e.date === "string" ? e.date : new Date(e.date).toISOString(),
      type: "expense" as const,
      category: e.category,
    })),
    ...bills.map(b => ({
      id: b.id,
      name: b.name,
      amount: b.amount,
      date: b.dueDate ? (typeof b.dueDate === "string" ? b.dueDate : new Date(b.dueDate).toISOString()) : startDate.toISOString(),
      type: "bill" as const,
    })),
    ...emis.map(emi => {
      let amount = emi.emiAmount;
      if (emi.isPreEmi && emi.slabs) {
        const totalDisbursed = emi.slabs
          .filter((s: any) => s.status === "DISBURSED")
          .reduce((sum: number, s: any) => sum + s.amount, 0);
        amount = (totalDisbursed * (emi.interestRate / 100)) / 12;
      }
      return {
        id: emi.id,
        name: emi.isPreEmi ? `${emi.name} (Pre-EMI)` : emi.name,
        amount: Math.round(amount),
        date: startDate.toISOString(),
        type: "emi" as const,
      };
    }),
    ...creditCardStatements.map(stmt => ({
      id: stmt.id,
      name: `${stmt.creditCard.bank} - ${stmt.creditCard.name} Statement`,
      amount: stmt.statementAmount,
      date: new Date(stmt.year, stmt.month - 1, stmt.creditCard.dueDate || 1).toISOString(),
      type: "bill" as const,
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
