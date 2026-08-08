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
import { createEMI } from "@/actions/emis";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const emiSchema = z.object({
  isPreEmi: z.boolean(),
  name: z.string().min(1, "Loan Name is required"),
  bank: z.string().min(1, "Bank name is required"),
  totalLoan: z.coerce.number().min(1, "Total Loan must be > 0"),
  emiAmount: z.coerce.number().min(0, "EMI Amount cannot be negative"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  remainingMonths: z.coerce.number().min(0, "Months cannot be negative"),
  interestRate: z.coerce.number().min(0, "Rate cannot be negative"),
  notes: z.string().optional(),
  
  // Pre-EMI fields
  propertyName: z.string().optional(),
  sanctionDate: z.string().optional(),
  expectedCompletion: z.string().optional(),
  builderName: z.string().optional(),
});

type EMIFormValues = z.infer<typeof emiSchema>;

export function AddEMIDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EMIFormValues>({
    resolver: zodResolver(emiSchema) as any,
    defaultValues: {
      isPreEmi: false,
      name: "",
      bank: "",
      totalLoan: 0,
      emiAmount: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      remainingMonths: 0,
      interestRate: 0,
      notes: "",
      propertyName: "",
      sanctionDate: new Date().toISOString().split("T")[0],
      expectedCompletion: new Date().toISOString().split("T")[0],
      builderName: "",
    },
  });

  const isPreEmi = form.watch("isPreEmi");

  async function onSubmit(data: EMIFormValues) {
    setIsLoading(true);
    try {
      await createEMI({
        ...data,
        startDate: data.startDate,
        endDate: data.endDate,
        sanctionDate: data.sanctionDate ? data.sanctionDate : undefined,
        expectedCompletion: data.expectedCompletion ? data.expectedCompletion : undefined,
      });
      toast.success(isPreEmi ? "Pre-EMI added successfully" : "EMI added successfully");
      setOpen(false);
      form.reset();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add loan");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button />
        }
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Loan
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Loan</DialogTitle>
          <DialogDescription>
            Record your loan details to track EMIs or construction-linked Pre-EMIs.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="isPreEmi"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Loan Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(val) => field.onChange(val === "true")}
                      value={field.value ? "true" : "false"}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal">Regular EMI</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal">Pre-EMI (Construction-linked)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 mt-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Home Loan" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank/Lender</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HDFC Bank" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalLoan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Sanctioned Loan (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interest Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isPreEmi && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg space-y-4 border border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Prestige Heights" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="builderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Builder (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Prestige Group" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sanctionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sanction Date</FormLabel>
                        <FormControl>
                          <Input type="date" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expectedCompletion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Completion</FormLabel>
                        <FormControl>
                          <Input type="date" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pre-EMI amounts are calculated automatically based on disbursement slabs added later. 
                  Start Date, End Date, and Tenure will be finalized when transitioning to a Regular EMI.
                </p>
              </div>
            )}

            {!isPreEmi && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emiAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly EMI (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remainingMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remaining Months</FormLabel>
                        <FormControl>
                          <Input type="number" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
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
