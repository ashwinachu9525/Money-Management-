"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEMIs() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.eMI.findMany({
    where: { userId: session.user.id },
    orderBy: { endDate: "desc" },
    include: { slabs: { orderBy: { slabNumber: "asc" } } }
  });
}

export async function createEMI(data: {
  name: string;
  bank: string;
  totalLoan: number;
  emiAmount: number;
  startDate: string | Date;
  endDate: string | Date;
  remainingMonths: number;
  interestRate: number;
  notes?: string;
  isPreEmi?: boolean;
  propertyName?: string;
  sanctionDate?: string | Date | null;
  expectedCompletion?: string | Date | null;
  builderName?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const emi = await prisma.eMI.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      sanctionDate: data.sanctionDate ? new Date(data.sanctionDate) : undefined,
      expectedCompletion: data.expectedCompletion ? new Date(data.expectedCompletion) : undefined,
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/emi");
  revalidatePath("/dashboard");
  return { success: true, id: emi.id };
}

export async function deleteEMI(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const emi = await prisma.eMI.findUnique({
    where: { id },
  });

  if (!emi || emi.userId !== session.user.id) {
    throw new Error("EMI not found or unauthorized");
  }

  await prisma.eMI.delete({
    where: { id },
  });

  revalidatePath("/dashboard/emi");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEMI(id: string, data: {
  name?: string;
  bank?: string;
  totalLoan?: number;
  emiAmount?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  interestRate?: number;
  notes?: string;
  isPreEmi?: boolean;
  propertyName?: string;
  sanctionDate?: string | Date | null;
  expectedCompletion?: string | Date | null;
  builderName?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.eMI.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("EMI not found or unauthorized");
  }

  let remainingMonths = existing.remainingMonths;
  let parsedEndDate: Date | undefined;
  
  if (data.endDate) {
    parsedEndDate = new Date(data.endDate);
    const now = new Date();
    const months = (parsedEndDate.getFullYear() - now.getFullYear()) * 12 + (parsedEndDate.getMonth() - now.getMonth());
    remainingMonths = months > 0 ? months : 0;
  }

  await prisma.eMI.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: parsedEndDate,
      sanctionDate: data.sanctionDate ? new Date(data.sanctionDate) : undefined,
      expectedCompletion: data.expectedCompletion ? new Date(data.expectedCompletion) : undefined,
      remainingMonths: data.endDate ? remainingMonths : undefined,
    },
  });

  revalidatePath("/dashboard/emi");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addDisbursementSlab(emiId: string, data: {
  slabNumber: number;
  amount: number;
  constructionStage: string;
  remarks?: string;
  releaseDate?: string | Date | null;
  status: "PENDING" | "DISBURSED";
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.eMI.findUnique({
    where: { id: emiId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("EMI not found or unauthorized");
  }

  await prisma.disbursementSlab.create({
    data: {
      ...data,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      emiId,
    },
  });

  revalidatePath("/dashboard/emi");
  return { success: true };
}

export async function updateDisbursementSlab(slabId: string, data: {
  amount?: number;
  constructionStage?: string;
  remarks?: string;
  releaseDate?: string | Date | null;
  status?: "PENDING" | "DISBURSED";
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const slab = await prisma.disbursementSlab.findUnique({
    where: { id: slabId },
    include: { emi: true },
  });

  if (!slab || slab.emi.userId !== session.user.id) {
    throw new Error("Slab not found or unauthorized");
  }

  await prisma.disbursementSlab.update({
    where: { id: slabId },
    data: {
      ...data,
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
    },
  });

  revalidatePath("/dashboard/emi");
  return { success: true };
}

export async function convertToRegularEMI(emiId: string, data: {
  emiAmount: number;
  startDate: string | Date;
  endDate: string | Date;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.eMI.findUnique({
    where: { id: emiId },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("EMI not found or unauthorized");
  }

  if (isNaN(data.emiAmount) || data.emiAmount < 0) {
    throw new Error("Invalid EMI Amount");
  }

  const now = new Date();
  const end = new Date(data.endDate);
  const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  const remainingMonths = months > 0 ? months : 0;

  await prisma.eMI.update({
    where: { id: emiId },
    data: {
      isPreEmi: false,
      emiAmount: data.emiAmount,
      startDate: new Date(data.startDate),
      endDate: end,
      remainingMonths,
    },
  });

  revalidatePath("/dashboard/emi");
  revalidatePath("/dashboard");
  return { success: true };
}
