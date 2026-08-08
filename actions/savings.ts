"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSavings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.saving.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSaving(data: {
  name: string;
  category: string;
  institution?: string;
  policyNumber?: string;
  frequency: string;
  contributionAmount: number;
  totalInvestment: number;
  currentValue?: number;
  startDate: string | Date;
  maturityDate?: string | Date | null;
  notes?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const saving = await prisma.saving.create({
    data: {
      name: data.name,
      category: data.category,
      institution: data.institution || null,
      policyNumber: data.policyNumber || null,
      frequency: data.frequency || "MONTHLY",
      contributionAmount: Number(data.contributionAmount) || 0,
      totalInvestment: Number(data.totalInvestment) || 0,
      currentValue: data.currentValue ? Number(data.currentValue) : null,
      startDate: new Date(data.startDate),
      maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
      notes: data.notes || null,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/savings");
  revalidatePath("/dashboard");
  return { success: true, saving };
}

export async function updateSaving(
  id: string,
  data: {
    name?: string;
    category?: string;
    institution?: string;
    policyNumber?: string;
    frequency?: string;
    contributionAmount?: number;
    totalInvestment?: number;
    currentValue?: number | null;
    startDate?: string | Date;
    maturityDate?: string | Date | null;
    notes?: string;
  }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.saving.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Saving record not found or unauthorized");
  }

  await prisma.saving.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.institution !== undefined && { institution: data.institution || null }),
      ...(data.policyNumber !== undefined && { policyNumber: data.policyNumber || null }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.contributionAmount !== undefined && { contributionAmount: Number(data.contributionAmount) }),
      ...(data.totalInvestment !== undefined && { totalInvestment: Number(data.totalInvestment) }),
      ...(data.currentValue !== undefined && { currentValue: data.currentValue ? Number(data.currentValue) : null }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.maturityDate !== undefined && { maturityDate: data.maturityDate ? new Date(data.maturityDate) : null }),
      ...(data.notes !== undefined && { notes: data.notes || null }),
    },
  });

  revalidatePath("/dashboard/savings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteSaving(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.saving.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Saving record not found or unauthorized");
  }

  await prisma.saving.delete({
    where: { id },
  });

  revalidatePath("/dashboard/savings");
  revalidatePath("/dashboard");
  return { success: true };
}
