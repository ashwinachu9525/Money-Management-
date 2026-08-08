"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pencil, Loader2 } from "lucide-react";
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
import { updateBankAccount } from "@/actions/bank-accounts";
type SerializedBankAccount = {
  id: string;
  userId: string;
  bankName: string;
  accountNick: string;
  last5Digits: string;
  balance: number;
  accountType: string;
  createdAt: string;
  updatedAt: string;
};

const accountSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountNick: z.string().min(1, "Account nickname is required"),
  last5Digits: z.string().regex(/^\d{1,5}$/, "Must be up to 5 digits"),
  balance: z.coerce.number().min(0, "Balance cannot be negative"),
  accountType: z.string().min(1, "Account type is required"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function EditAccountDialog({ account }: { account: SerializedBankAccount }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      bankName: account.bankName,
      accountNick: account.accountNick,
      last5Digits: account.last5Digits,
      balance: account.balance,
      accountType: account.accountType,
    },
  });

  async function onSubmit(data: AccountFormValues) {
    setIsLoading(true);
    try {
      await updateBankAccount(account.id, data);
      toast.success("Bank account updated successfully");
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update bank account");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-8 w-8" title="Edit" />}>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit Bank Account</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Bank Account</DialogTitle>
          <DialogDescription>
            Update your bank account details. Do not enter full account numbers or passwords.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. HDFC Bank" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountNick"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Salary Account" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Savings/Current" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last5Digits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last 5 Digits</FormLabel>
                    <FormControl>
                      <Input placeholder="12345" maxLength={5} disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Balance (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
