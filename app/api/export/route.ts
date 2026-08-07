import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const format = searchParams.get("format") || "excel";

  // Fetch data
  const incomes = await prisma.income.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' } });
  const expenses = await prisma.expense.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' } });

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    
    // Income Sheet
    const incomeSheet = workbook.addWorksheet("Incomes");
    incomeSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Source", key: "source", width: 25 },
      { header: "Category", key: "category", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
    ];
    
    incomes.forEach(i => {
      incomeSheet.addRow({
        date: i.date.toISOString().split('T')[0],
        source: i.sourceName,
        category: i.category,
        amount: i.amount
      });
    });

    // Expense Sheet
    const expenseSheet = workbook.addWorksheet("Expenses");
    expenseSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Category", key: "category", width: 20 },
      { header: "Notes", key: "notes", width: 25 },
      { header: "Amount", key: "amount", width: 15 },
    ];

    expenses.forEach(e => {
      expenseSheet.addRow({
        date: e.date.toISOString().split('T')[0],
        category: e.category,
        notes: e.notes || "",
        amount: e.amount
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="financial_report.xlsx"'
      }
    });
  }

  if (format === "csv") {
    // Generate simple CSV
    let csv = "Date,Type,Category,Description,Amount\n";
    
    incomes.forEach(i => {
      csv += `${i.date.toISOString().split('T')[0]},Income,${i.category},${i.sourceName},${i.amount}\n`;
    });
    
    expenses.forEach(e => {
      csv += `${e.date.toISOString().split('T')[0]},Expense,${e.category},${e.notes || ""},${e.amount}\n`;
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="financial_report.csv"'
      }
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
