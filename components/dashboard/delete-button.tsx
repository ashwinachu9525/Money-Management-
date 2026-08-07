"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { deleteIncome } from "@/actions/incomes";
import { deleteExpense } from "@/actions/expenses";
import { deleteBill } from "@/actions/bills";
import { deleteGoal } from "@/actions/goals";
import { deleteBankAccount } from "@/actions/bank-accounts";
import { deleteEMI } from "@/actions/emis";

interface DeleteButtonProps {
  id?: string;
  itemType?: "Income" | "Expense" | "Bill" | "Goal" | "Account" | "EMI" | "Pre-EMI Loan" | string;
}

export function DeleteButton({ id, itemType = "Item" }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        if (!id) return;
        if (itemType === "Income") await deleteIncome(id);
        else if (itemType === "Expense") await deleteExpense(id);
        else if (itemType === "Bill") await deleteBill(id);
        else if (itemType === "Goal") await deleteGoal(id);
        else if (itemType === "Account") await deleteBankAccount(id);
        else if (itemType === "EMI" || itemType === "Pre-EMI Loan") await deleteEMI(id);
        
        toast.success(`${itemType} deleted successfully`);
        setOpen(false);
      } catch (error) {
        toast.error(`Failed to delete ${itemType.toLowerCase()}`);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
            disabled={isPending}
            title="Delete"
          />
        }
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete {itemType}</span>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this {itemType.toLowerCase()}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault(); // Prevent immediate closing if we want to show loading
              handleDelete();
            }} 
            disabled={isPending}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
