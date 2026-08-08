"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMonthlyFinancialReportEmail } from "@/lib/email";
import { filterTransactionsForMonth } from "@/lib/utils";
import { format } from "date-fns";

export async function sendMonthlyReportViaEmail(month: number, year: number) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      return { success: false, error: "User not authenticated or missing email address" };
    }

    const userId = session.user.id;
    const recipientEmail = session.user.email;
    const userName = session.user.name || "User";

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const monthName = format(startDate, "MMMM");

    // Fetch data including recurring entries
    const rawIncomes = await prisma.income.findMany({
      where: {
        userId,
        OR: [
          { date: { gte: startDate, lte: endDate } },
          { isRecurring: true, date: { lte: endDate } }
        ]
      },
    });

    const rawExpenses = await prisma.expense.findMany({
      where: {
        userId,
        OR: [
          { date: { gte: startDate, lte: endDate } },
          { isRecurring: true, date: { lte: endDate } }
        ]
      },
    });

    const incomes = filterTransactionsForMonth(JSON.parse(JSON.stringify(rawIncomes)), month, year, false);
    const expenses = filterTransactionsForMonth(JSON.parse(JSON.stringify(rawExpenses)), month, year, false);

    const bills = await prisma.bill.findMany({
      where: {
        userId,
        dueDate: { gte: startDate, lte: endDate },
      },
    });

    const emis = await prisma.eMI.findMany({
      where: {
        userId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: { slabs: true },
    });

    const creditCardStatements = await prisma.creditCardStatement.findMany({
      where: {
        creditCard: { userId },
        month: month + 1,
        year: year,
      },
      include: { creditCard: true },
    });

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBills = bills.reduce((sum, b) => sum + b.amount, 0) + creditCardStatements.reduce((sum, s) => sum + s.statementAmount, 0);
    
    const totalEMIs = emis.reduce((sum, emi) => {
      let amount = emi.emiAmount;
      if (emi.isPreEmi && emi.slabs) {
        const totalDisbursed = emi.slabs
          .filter((s: any) => s.status === "DISBURSED")
          .reduce((s: number, slab: any) => s + slab.amount, 0);
        amount = (totalDisbursed * (emi.interestRate / 100)) / 12;
      }
      return sum + amount;
    }, 0);

    const netSavings = totalIncome - (totalExpense + totalBills + totalEMIs);

    // Group categories
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    });

    const categories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Transactions list
    const transactions = [
      ...incomes.map((i) => ({ name: i.sourceName, amount: i.amount, type: "income", category: i.category })),
      ...expenses.map((e) => ({ name: e.notes || e.category, amount: e.amount, type: "expense", category: e.category })),
      ...bills.map((b) => ({ name: b.name, amount: b.amount, type: "bill", category: "Utility Bill" })),
      ...emis.map((emi) => ({ name: emi.isPreEmi ? `${emi.name} (Pre-EMI)` : emi.name, amount: emi.emiAmount, type: "emi", category: "Loan EMI" })),
    ].sort((a, b) => b.amount - a.amount);

    await sendMonthlyFinancialReportEmail({
      toEmail: recipientEmail,
      userName,
      monthName,
      year,
      totalIncome,
      totalExpense,
      totalBills,
      totalEMIs,
      netSavings,
      categories,
      transactions,
    });

    return { success: true, recipient: recipientEmail };
  } catch (error) {
    console.error("Failed to send monthly report email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" };
  }
}
