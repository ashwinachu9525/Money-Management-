"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, subDays } from "date-fns";

export async function getNotifications() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const now = new Date();
  const next5Days = addDays(now, 5);

  // Auto-generate notifications for pending bills due soon or overdue
  const pendingBills = await prisma.bill.findMany({
    where: {
      userId,
      status: "UNPAID",
      dueDate: { lte: next5Days },
    },
  });

  for (const bill of pendingBills) {
    const isOverdue = new Date(bill.dueDate) < now;
    const title = isOverdue ? `⚠️ Bill Overdue: ${bill.name}` : `📅 Bill Due Soon: ${bill.name}`;
    const message = isOverdue
      ? `Your bill of ₹${bill.amount.toLocaleString("en-IN")} was due on ${new Date(bill.dueDate).toLocaleDateString("en-IN")}.`
      : `Your bill of ₹${bill.amount.toLocaleString("en-IN")} is due on ${new Date(bill.dueDate).toLocaleDateString("en-IN")}.`;

    // Check if notification already exists
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        title,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
        },
      });
    }
  }

  // Auto-generate notifications for Credit Card statement dues
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const statements = await prisma.creditCardStatement.findMany({
    where: {
      creditCard: { userId },
      month: currentMonth,
      year: currentYear,
      isPaid: false,
    },
    include: { creditCard: true },
  });

  for (const stmt of statements) {
    const title = `💳 Credit Card Payment Due: ${stmt.creditCard.bank} ${stmt.creditCard.name}`;
    const message = `Statement total of ₹${stmt.statementAmount.toLocaleString("en-IN")} is due by day ${stmt.creditCard.dueDate} of this month.`;

    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        title,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
        },
      });
    }
  }

  // Auto-generate Saturday / Sunday Weekend Expense & Income Tracking Reminder
  const dayOfWeek = now.getDay(); // 6 = Saturday, 0 = Sunday
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    const dayName = dayOfWeek === 6 ? "Saturday" : "Sunday";
    const title = `📊 ${dayName} Reminder: Track your expense and income!`;
    const message = `Take 2 minutes to record your weekly expenses, income, and bank transactions before the weekend ends.`;

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const existingWeekendReminder = await prisma.notification.findFirst({
      where: {
        userId,
        title,
        createdAt: { gte: todayStart },
      },
    });

    if (!existingWeekendReminder) {
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
        },
      });
    }
  }

  // Fetch all user notifications
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return JSON.parse(JSON.stringify(notifications));
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false };

  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { isRead: true },
  });

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false };

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  return { success: true };
}

export async function clearAllNotifications() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false };

  await prisma.notification.deleteMany({
    where: { userId: session.user.id },
  });

  return { success: true };
}

export async function createTestNotification() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: `🔔 Test Notification (${timeStr})`,
      message: `Your notification system is working perfectly! All bill dues, EMI reminders, and weekend tracking alerts will appear here.`,
    },
  });

  return { success: true };
}
