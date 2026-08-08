"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addStatement, updateStatement } from "@/actions/credit-cards";
import { formatIndianCurrency } from "@/lib/utils";

const statementSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  statementAmount: z.coerce.number().min(0, "Amount must be positive"),
  minimumDue: z.coerce.number().min(0, "Amount must be positive"),
  status: z.string(),
  paidAmount: z.coerce.number().min(0),
});

type StatementFormValues = z.infer<typeof statementSchema>;

interface StatementDialogProps {
  creditCardId: string;
  statement?: any; // Pass existing statement to edit
  trigger?: React.ReactNode;
}

export function StatementDialog({ creditCardId, statement, trigger }: StatementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!statement;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const form = useForm<StatementFormValues>({
    resolver: zodResolver(statementSchema),
    defaultValues: {
      month: statement?.month || currentMonth,
      year: statement?.year || currentYear,
      statementAmount: statement?.statementAmount || 0,
      minimumDue: statement?.minimumDue || 0,
      status: statement?.status || "PENDING",
      paidAmount: statement?.paidAmount || 0,
    },
  });

  // Watch status to auto-fill paidAmount
  const status = form.watch("status");
  const statementAmount = form.watch("statementAmount");
  const minimumDue = form.watch("minimumDue");
  const paidAmount = form.watch("paidAmount");

  useEffect(() => {
    if (status === "PAID_FULL") {
      form.setValue("paidAmount", statementAmount);
    } else if (status === "PAID_MINIMUM") {
      form.setValue("paidAmount", minimumDue);
    } else if (status === "PENDING" && !isEditing) {
      form.setValue("paidAmount", 0);
    }
  }, [status, statementAmount, minimumDue, form, isEditing]);

  async function onSubmit(data: StatementFormValues) {
    setIsLoading(true);
    try {
      let result;
      if (isEditing) {
        result = await updateStatement(statement.id, data);
      } else {
        result = await addStatement({
          ...data,
          creditCardId,
        });
      }

      if (result.success) {
        toast.success(isEditing ? "Statement updated" : "Statement added");
        setOpen(false);
        if (!isEditing) form.reset();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          (trigger as React.ReactElement) || (
            <Button variant="outline" size="sm">
              {isEditing ? <Edit className="h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {isEditing ? "" : "Add Statement"}
            </Button>
          )
        }
      >
        {!trigger && (
          <>
            {isEditing ? <Edit className="h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {isEditing ? "" : "Add Statement"}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Statement" : "Add Statement"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your statement details." : "Enter the details of your monthly statement."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month (1-12)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="statementAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Due</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    {Number(field.value) > 0 && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {formatIndianCurrency(field.value)}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimumDue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Due</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    {Number(field.value) > 0 && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {formatIndianCurrency(field.value)}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID_MINIMUM">Paid Minimum</SelectItem>
                      <SelectItem value="PAID_FULL">Paid in Full</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paidAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid Amount</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  {Number(field.value) > 0 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                      {formatIndianCurrency(field.value)}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Statement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
