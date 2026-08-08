"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pencil, Loader2, PiggyBank } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSaving } from "@/actions/savings";

const SAVINGS_CATEGORIES = [
  "EPF / Employee Provident Fund",
  "LIC / Life Insurance",
  "Kotak Future Secure / Savings Plan",
  "Mutual Funds / SIP",
  "Stocks / Equity",
  "Fixed Deposit / RD",
  "PPF / NPS / Pension",
  "Health & Term Insurance",
  "Sovereign Gold Bonds / Gold",
  "Other Savings Option",
];

const FREQUENCIES = [
  { label: "Monthly (Per Month)", value: "MONTHLY" },
  { label: "Quarterly (Every 3 Months)", value: "QUARTERLY" },
  { label: "Half-Yearly (Every 6 Months)", value: "HALF_YEARLY" },
  { label: "Yearly (Per Year)", value: "YEARLY" },
  { label: "One-Time (Lumpsum)", value: "ONE_TIME" },
];

const savingSchema = z.object({
  name: z.string().min(2, "Name/Policy title is required"),
  category: z.string().min(1, "Category is required"),
  institution: z.string().optional(),
  policyNumber: z.string().optional(),
  frequency: z.string().default("MONTHLY"),
  contributionAmount: z.coerce.number().min(0, "Amount cannot be negative"),
  totalInvestment: z.coerce.number().min(0, "Total investment cannot be negative"),
  currentValue: z.coerce.number().optional(),
  startDate: z.string().min(1, "Start Date is required"),
  maturityDate: z.string().optional(),
  notes: z.string().optional(),
});

type SavingFormValues = z.infer<typeof savingSchema>;

export function EditSavingDialog({ saving }: { saving: any }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SavingFormValues>({
    resolver: zodResolver(savingSchema) as any,
    defaultValues: {
      name: saving.name,
      category: saving.category,
      institution: saving.institution || "",
      policyNumber: saving.policyNumber || "",
      frequency: saving.frequency || "MONTHLY",
      contributionAmount: saving.contributionAmount || 0,
      totalInvestment: saving.totalInvestment || 0,
      currentValue: saving.currentValue || 0,
      startDate: saving.startDate ? saving.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
      maturityDate: saving.maturityDate ? saving.maturityDate.split("T")[0] : "",
      notes: saving.notes || "",
    },
  });

  async function onSubmit(data: SavingFormValues) {
    setIsLoading(true);
    try {
      await updateSaving(saving.id, {
        ...data,
        currentValue: data.currentValue ? Number(data.currentValue) : null,
        maturityDate: data.maturityDate ? data.maturityDate : null,
      });
      toast.success("Investment updated successfully");
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update investment");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50" title="Edit" />}>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit Investment</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Edit Savings / Investment
          </DialogTitle>
          <DialogDescription>
            Update policy details, contribution amount, or current portfolio value.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saving / Policy Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. LIC Jeevan Anand, Kotak Future Secure"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SAVINGS_CATEGORIES.map((cat) => (
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

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Investment Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider / Institution (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. LIC, Kotak Life, Zerodha, SBI" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="policyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy / Folio No. (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. POL12345678" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contributionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodic Premium (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalInvestment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Invested (₹) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Optional valuation" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maturityDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maturity / Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any policy details or notes..." disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
