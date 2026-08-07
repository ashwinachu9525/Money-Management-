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
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const income = await prisma.income.create({
    data: {
      ...data,
      date: new Date(data.date),
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/incomes");
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

  await prisma.income.delete({
    where: { id },
  });

  revalidatePath("/dashboard/incomes");
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
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.income.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Income not found or unauthorized");
  }

  const updatedIncome = await prisma.income.update({
    where: { id },
    data: {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    },
  });

  revalidatePath("/dashboard/incomes");
  revalidatePath("/dashboard");
  return { success: true };
}

