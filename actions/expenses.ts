"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getExpenses() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.expense.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(data: {
  category: string;
  amount: number;
  date: string | Date;
  notes?: string;
  isRecurring: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const expense = await prisma.expense.create({
    data: {
      ...data,
      date: new Date(data.date),
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense || expense.userId !== session.user.id) {
    throw new Error("Expense not found or unauthorized");
  }

  await prisma.expense.delete({
    where: { id },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateExpense(id: string, data: {
  category?: string;
  amount?: number;
  date?: string | Date;
  notes?: string;
  isRecurring?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Expense not found or unauthorized");
  }

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

