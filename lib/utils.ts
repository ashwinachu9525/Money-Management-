import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as formatFn } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIndianCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

export function formatDate(date: string | Date | null | undefined, formatStr: string = "MMM d, yyyy"): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return formatFn(d, formatStr);
  } catch (e) {
    return "";
  }
}

export function filterTransactionsForMonth<T extends { date: string | Date; isRecurring?: boolean }>(
  items: T[],
  filterMonth: number,
  filterYear: number,
  isAllTime: boolean
): T[] {
  if (isAllTime) return items;

  const targetPeriodEnd = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59);

  const result: T[] = [];

  for (const item of items) {
    const itemDate = new Date(item.date);

    if (item.isRecurring) {
      // Recurring items automatically carry forward to any selected month on or after their start date!
      if (itemDate <= targetPeriodEnd) {
        const projectedDay = Math.min(itemDate.getDate(), targetPeriodEnd.getDate());
        const projectedDate = new Date(filterYear, filterMonth, projectedDay);
        result.push({
          ...item,
          date: projectedDate.toISOString(),
        });
      }
    } else {
      // Non-recurring items appear only in their exact creation month & year
      if (itemDate.getMonth() === filterMonth && itemDate.getFullYear() === filterYear) {
        result.push(item);
      }
    }
  }

  return result;
}
