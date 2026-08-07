"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getGoals() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { targetDate: "asc" },
  });
}

export async function createGoal(data: {
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date | string;
  targetDate: Date | string;
  priority: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const goal = await prisma.goal.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      targetDate: new Date(data.targetDate),
      userId: session.user.id,
    },
  });

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGoalProgress(id: string, additionalAmount: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const goal = await prisma.goal.findUnique({
    where: { id },
  });

  if (!goal || goal.userId !== session.user.id) {
    throw new Error("Goal not found or unauthorized");
  }

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: { currentAmount: goal.currentAmount + additionalAmount },
  });

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const goal = await prisma.goal.findUnique({
    where: { id },
  });

  if (!goal || goal.userId !== session.user.id) {
    throw new Error("Goal not found or unauthorized");
  }

  await prisma.goal.delete({
    where: { id },
  });

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGoal(id: string, data: {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  startDate?: Date | string;
  targetDate?: Date | string;
  priority?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await prisma.goal.findUnique({
    where: { id },
  });

  if (!existing || existing.userId !== session.user.id) {
    throw new Error("Goal not found or unauthorized");
  }

  const updatedGoal = await prisma.goal.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    },
  });

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

