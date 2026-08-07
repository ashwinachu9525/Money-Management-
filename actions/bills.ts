"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBills() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.bill.findMany({
    where: { userId: session.user.id },
    orderBy: { dueDate: "asc" },
  });
}

export async function createBill(data: {
  name: string;
  dueDate: Date | string;
  amount: number;
  status: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const bill = await prisma.bill.create({
    data: {
      ...data,
      dueDate: new Date(data.dueDate),
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/bills");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBill(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const bill = await prisma.bill.findUnique({
    where: { id },
  });

  if (!bill || bill.userId !== session.user.id) {
    throw new Error("Bill not found or unauthorized");
  }

  await prisma.bill.delete({
    where: { id },
  });

  revalidatePath("/dashboard/bills");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBill(id: string, data: {
  name?: string;
  dueDate?: Date | string;
  amount?: number;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.bill.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Bill not found or unauthorized");
  }

  const updatedBill = await prisma.bill.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  });

  revalidatePath("/dashboard/bills");
  revalidatePath("/dashboard");
  return { success: true };
}


export async function markBillAsPaid(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const bill = await prisma.bill.findUnique({
    where: { id },
  });

  if (!bill || bill.userId !== session.user.id) {
    throw new Error("Bill not found or unauthorized");
  }

  const updatedBill = await prisma.bill.update({
    where: { id },
    data: { status: "PAID" },
  });

  revalidatePath("/dashboard/bills");
  revalidatePath("/dashboard");
  return { success: true };
}
