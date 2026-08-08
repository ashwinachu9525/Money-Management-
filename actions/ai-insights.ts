"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

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
    Format your response in clean markdown (bullet points) focusing on:
    1. Spending habits and category breakdown
    2. Saving opportunities or budget recommendations
    3. Goal achievement & EMI payment suggestions

    Financial Context:
    - Monthly Income: ₹${totalIncome}
    - Variable Expenses: ₹${totalExpense}
    - Regular EMI: ₹${totalRegularEMI}
    - Pre-EMI (Construction Loans): ₹${totalPreEmiPayments}
    - Total Liabilities Outflow: ₹${totalEMI}
    - Calculated Net Savings: ₹${savings}
    - Category Spending: ${JSON.stringify(categorySpending)}
    - Active Goals Count: ${goals.length}
  `;

  try {
    let aiResponse = "";

    try {
      // Primary: Google Gen AI SDK Interactions API (gemini-3.6-flash)
      const interaction = await (ai as any).interactions.create({
        model: "gemini-3.6-flash",
        input: prompt,
      });
      aiResponse = interaction.output_text || interaction.text || "";
    } catch (primaryErr) {
      // Fallback: Google Gen AI Models API (gemini-2.5-flash)
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      aiResponse = response.text || "";
    }

    if (!aiResponse) {
      aiResponse = "Unable to generate insights at the moment. Please verify your financial entries and try again.";
    }

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
    throw new Error("Failed to generate AI insights. Make sure GEMINI_API_KEY is set in .env.");
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
