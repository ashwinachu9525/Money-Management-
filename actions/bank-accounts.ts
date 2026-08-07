"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBankAccounts() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.bankAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBankAccount(data: {
  bankName: string;
  accountNick: string;
  last5Digits: string;
  balance: number;
  accountType: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const accountCount = await prisma.bankAccount.count({
    where: { userId: session.user.id },
  });

  if (accountCount >= 10) {
    throw new Error("Maximum of 10 bank accounts allowed.");
  }

  const account = await prisma.bankAccount.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/accounts");
  return { success: true };
}

export async function deleteBankAccount(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const account = await prisma.bankAccount.findUnique({
    where: { id },
  });

  if (!account || account.userId !== session.user.id) {
    throw new Error("Account not found or unauthorized");
  }

  await prisma.bankAccount.delete({
    where: { id },
  });

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBankAccount(id: string, data: {
  bankName?: string;
  accountNick?: string;
  last5Digits?: string;
  balance?: number;
  accountType?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.bankAccount.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Bank account not found or unauthorized");
  }

  const updatedAccount = await prisma.bankAccount.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  return { success: true };
}
