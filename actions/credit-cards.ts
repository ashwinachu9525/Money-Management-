"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addCreditCard(data: {
  userId: string;
  bank: string;
  name: string;
  last4Digits: string;
  creditLimit: number;
  billingCycleDate: number;
  dueDate: number;
}) {
  try {
    const card = await prisma.creditCard.create({
      data: {
        userId: data.userId,
        bank: data.bank,
        name: data.name,
        last4Digits: data.last4Digits,
        creditLimit: data.creditLimit,
        billingCycleDate: data.billingCycleDate,
        dueDate: data.dueDate,
      },
    });
    revalidatePath("/dashboard/credit-cards");
    return { success: true, card };
  } catch (error) {
    console.error("Failed to add credit card:", error);
    return { success: false, error: "Failed to add credit card" };
  }
}

export async function updateCreditCard(
  id: string,
  data: {
    bank: string;
    name: string;
    last4Digits: string;
    creditLimit: number;
    billingCycleDate: number;
    dueDate: number;
  }
) {
  try {
    const card = await prisma.creditCard.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/credit-cards");
    return { success: true, card };
  } catch (error) {
    console.error("Failed to update credit card:", error);
    return { success: false, error: "Failed to update credit card" };
  }
}

export async function deleteCreditCard(id: string) {
  try {
    await prisma.creditCard.delete({
      where: { id },
    });
    revalidatePath("/dashboard/credit-cards");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete credit card:", error);
    return { success: false, error: "Failed to delete credit card" };
  }
}

export async function addStatement(data: {
  creditCardId: string;
  month: number;
  year: number;
  statementAmount: number;
  minimumDue: number;
  status: string;
  paidAmount: number;
}) {
  try {
    const statement = await prisma.creditCardStatement.create({
      data: {
        creditCardId: data.creditCardId,
        month: data.month,
        year: data.year,
        statementAmount: data.statementAmount,
        minimumDue: data.minimumDue,
        status: data.status,
        paidAmount: data.paidAmount,
      },
    });
    revalidatePath("/dashboard/credit-cards");
    return { success: true, statement };
  } catch (error) {
    console.error("Failed to add statement:", error);
    return { success: false, error: "Failed to add statement" };
  }
}

export async function updateStatement(
  id: string,
  data: {
    statementAmount?: number;
    minimumDue?: number;
    status?: string;
    paidAmount?: number;
  }
) {
  try {
    const statement = await prisma.creditCardStatement.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/credit-cards");
    return { success: true, statement };
  } catch (error) {
    console.error("Failed to update statement:", error);
    return { success: false, error: "Failed to update statement" };
  }
}

export async function deleteStatement(id: string) {
  try {
    await prisma.creditCardStatement.delete({
      where: { id },
    });
    revalidatePath("/dashboard/credit-cards");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete statement:", error);
    return { success: false, error: "Failed to delete statement" };
  }
}
