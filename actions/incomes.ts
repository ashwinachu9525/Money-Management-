"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getIncomes() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.income.findMany({
    where: { userId: session.user.id },
    include: { bankAccount: true },
    orderBy: { date: "desc" },
  });
}

export async function createIncome(data: {
  sourceName: string;
  companyName?: string;
  category: string;
  amount: number;
  date: Date | string;
  notes?: string;
  isRecurring?: boolean;
  bankAccountId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const income = await prisma.income.create({
    data: {
      ...data,
      date: new Date(data.date),
      isRecurring: data.isRecurring ?? false,
      bankAccountId: data.bankAccountId || null,
      userId: session.user.id,
    },
  });

  // If a bank account is mapped, update its balance
  if (data.bankAccountId) {
    await prisma.bankAccount.update({
      where: { id: data.bankAccountId },
      data: {
        balance: {
          increment: data.amount,
        },
      },
    });
  }

  revalidatePath("/dashboard/incomes");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteIncome(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const income = await prisma.income.findUnique({
    where: { id },
  });

  if (!income || income.userId !== session.user.id) {
    throw new Error("Income not found or unauthorized");
  }

  // Adjust bank account balance if mapped
  if (income.bankAccountId) {
    await prisma.bankAccount.update({
      where: { id: income.bankAccountId },
      data: {
        balance: {
          decrement: income.amount,
        },
      },
    });
  }

  await prisma.income.delete({
    where: { id },
  });

  revalidatePath("/dashboard/incomes");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateIncome(id: string, data: {
  sourceName?: string;
  companyName?: string;
  category?: string;
  amount?: number;
  date?: Date | string;
  notes?: string;
  isRecurring?: boolean;
  bankAccountId?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.income.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Income not found or unauthorized");
  }

  // Handle balance adjustment if bank account or amount changed
  if (existing.bankAccountId && existing.bankAccountId !== data.bankAccountId) {
    await prisma.bankAccount.update({
      where: { id: existing.bankAccountId },
      data: { balance: { decrement: existing.amount } },
    });
    if (data.bankAccountId && data.amount) {
      await prisma.bankAccount.update({
        where: { id: data.bankAccountId },
        data: { balance: { increment: data.amount } },
      });
    }
  } else if (existing.bankAccountId && data.amount && data.amount !== existing.amount) {
    const diff = data.amount - existing.amount;
    await prisma.bankAccount.update({
      where: { id: existing.bankAccountId },
      data: { balance: { increment: diff } },
    });
  } else if (!existing.bankAccountId && data.bankAccountId && data.amount) {
    await prisma.bankAccount.update({
      where: { id: data.bankAccountId },
      data: { balance: { increment: data.amount } },
    });
  }

  const updatedIncome = await prisma.income.update({
    where: { id },
    data: {
      ...data,
      bankAccountId: data.bankAccountId || null,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

  revalidatePath("/dashboard/incomes");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

