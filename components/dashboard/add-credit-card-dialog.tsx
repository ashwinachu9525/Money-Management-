"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
import { addCreditCard } from "@/actions/credit-cards";

const creditCardSchema = z.object({
  bank: z.string().min(2, "Bank name is required"),
  name: z.string().min(2, "Card name is required"),
  last4Digits: z.string().regex(/^\d{4}$/, "Must be exactly 4 digits"),
  creditLimit: z.coerce.number().min(0, "Credit limit must be positive"),
  billingCycleDate: z.coerce.number().min(1).max(31, "Must be between 1 and 31"),
  dueDate: z.coerce.number().min(1).max(31, "Must be between 1 and 31"),
});

type CreditCardFormValues = z.infer<typeof creditCardSchema>;

export function AddCreditCardDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema) as any,
    defaultValues: {
      bank: "",
      name: "",
      last4Digits: "",
      creditLimit: 0,
      billingCycleDate: 1,
      dueDate: 15,
    },
  });

  async function onSubmit(data: CreditCardFormValues) {
    if (!session?.user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setIsLoading(true);
    try {
      const result = await addCreditCard({
        ...data,
        userId: session.user.id,
      });

      if (result.success) {
        toast.success("Credit card added successfully");
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to add credit card");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Card
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Credit Card</DialogTitle>
          <DialogDescription>
            Enter your credit card details to start tracking.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="HDFC, SBI, ICICI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Regalia, Amazon Pay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last4Digits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last 4 Digits</FormLabel>
                  <FormControl>
                    <Input placeholder="1234" maxLength={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingCycleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Date (1-31)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date (1-31)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Card
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
