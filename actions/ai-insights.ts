"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function generateFinancialInsights() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Fetch anonymized aggregate data
  const incomes = await prisma.income.findMany({ where: { userId: session.user.id } });
  const expenses = await prisma.expense.findMany({ where: { userId: session.user.id } });
  const emis = await prisma.eMI.findMany({ 
    where: { userId: session.user.id },
    include: { slabs: true }
  });
  const goals = await prisma.goal.findMany({ where: { userId: session.user.id } });

  // Calculate aggregates (NO PII)
  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const regularEMIs = emis.filter(e => !e.isPreEmi);
  const preEMIs = emis.filter(e => e.isPreEmi);
  
  const totalRegularEMI = regularEMIs.reduce((acc, curr) => acc + curr.emiAmount, 0);
  const totalPreEmiPayments = preEMIs.reduce((sum, emi) => {
    const totalDisbursed = emi.slabs
      .filter(s => s.status === "DISBURSED")
      .reduce((s, slab) => s + slab.amount, 0);
    return sum + ((totalDisbursed * (emi.interestRate / 100)) / 12);
  }, 0);

  const totalEMI = totalRegularEMI + totalPreEmiPayments;
  const savings = totalIncome - totalExpense - totalEMI;

  const categorySpending: Record<string, number> = {};
  expenses.forEach(e => {
    categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount;
  });

  const prompt = `
    Analyze the following anonymized financial data and provide 3 personalized insights.
    Format your response in simple markdown (no headings, just bullet points) focusing on:
    1. Spending habits
    2. Saving opportunities or budget recommendations
    3. Goal achievement suggestions

    Data:
    Monthly Income: ₹${totalIncome}
    Monthly Expense: ₹${totalExpense}
    Savings: ₹${savings}
    Regular EMI: ₹${totalRegularEMI}
    Pre-EMI (Construction Loans): ₹${totalPreEmiPayments}
    Total Liabilities Payment: ₹${totalEMI}
    Category Spending: ${JSON.stringify(categorySpending)}
    Number of Goals: ${goals.length}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const aiResponse = response.text || "Unable to generate insights at the moment.";

    // Save insight to DB
    await prisma.aIInsight.create({
      data: {
        userId: session.user.id,
        insight: aiResponse,
        type: "GENERAL",
      }
    });

    return { insights: aiResponse };
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate AI insights.");
  }
}

export async function getPastInsights() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.aIInsight.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
