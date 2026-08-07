"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createExpense } from "@/actions/expenses";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const expenseCategories = [
  "EMI", "Rent", "Family Support", "Electricity Bill", "Water Bill", "Internet", 
  "Fuel", "Grocery", "Shopping", "Food", "Travel", 
  "Insurance", "Healthcare", "Education", "Entertainment", "Miscellaneous"
];

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  bankAccountId: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function AddExpenseDialog({ accounts = [] }: { accounts?: any[] }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      isRecurring: false,
      bankAccountId: "",
    },
  });

  async function onSubmit(data: ExpenseFormValues) {
    setIsLoading(true);
    try {
      await createExpense({
        ...data,
        date: data.date,
      });
      toast.success("Expense added successfully");
      setOpen(false);
      form.reset();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add expense");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Expense
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Record a new expense to track your spending.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {accounts.length > 0 && (
              <FormField
                control={form.control}
                name="bankAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid From Bank Account (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank account..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc: any) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.bankName} ({acc.accountNick} - •••{acc.last5Digits})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional details..." disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Recurring Expense
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Mark this if this is a recurring monthly expense
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
