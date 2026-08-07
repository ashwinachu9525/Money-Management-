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
    include: { bankAccount: true },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(data: {
  category: string;
  amount: number;
  date: string | Date;
  notes?: string;
  isRecurring: boolean;
  bankAccountId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const expense = await prisma.expense.create({
    data: {
      ...data,
      date: new Date(data.date),
      bankAccountId: data.bankAccountId || null,
      userId: session.user.id,
    },
  });

  // If a bank account is mapped, deduct from its balance
  if (data.bankAccountId) {
    await prisma.bankAccount.update({
      where: { id: data.bankAccountId },
      data: {
        balance: {
          decrement: data.amount,
        },
      },
    });
  }

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/accounts");
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

  // Restore bank account balance if mapped
  if (expense.bankAccountId) {
    await prisma.bankAccount.update({
      where: { id: expense.bankAccountId },
      data: {
        balance: {
          increment: expense.amount,
        },
      },
    });
  }

  await prisma.expense.delete({
    where: { id },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateExpense(id: string, data: {
  category?: string;
  amount?: number;
  date?: string | Date;
  notes?: string;
  isRecurring?: boolean;
  bankAccountId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.expense.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Expense not found or unauthorized");
  }

  // Handle balance adjustment if bank account or amount changed
  if (existing.bankAccountId && existing.bankAccountId !== data.bankAccountId) {
    await prisma.bankAccount.update({
      where: { id: existing.bankAccountId },
      data: { balance: { increment: existing.amount } },
    });
    if (data.bankAccountId && data.amount) {
      await prisma.bankAccount.update({
        where: { id: data.bankAccountId },
        data: { balance: { decrement: data.amount } },
      });
    }
  } else if (existing.bankAccountId && data.amount && data.amount !== existing.amount) {
    const diff = data.amount - existing.amount;
    await prisma.bankAccount.update({
      where: { id: existing.bankAccountId },
      data: { balance: { decrement: diff } },
    });
  } else if (!existing.bankAccountId && data.bankAccountId && data.amount) {
    await prisma.bankAccount.update({
      where: { id: data.bankAccountId },
      data: { balance: { decrement: data.amount } },
    });
  }

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: {
      ...data,
      bankAccountId: data.bankAccountId || null,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

