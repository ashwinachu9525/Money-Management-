"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

type Transaction = {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: "income" | "expense";
  category: string;
};

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        No recent transactions found.
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-auto max-h-[350px] pr-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9 flex items-center justify-center space-y-0 border">
            <AvatarFallback className={transaction.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
              {transaction.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.name}</p>
            <p className="text-xs text-muted-foreground">
              {transaction.category} • {format(new Date(transaction.date), "MMM d, yyyy")}
            </p>
          </div>
          <div className={`ml-auto font-medium ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
      ))}
    </div>
  );
}
