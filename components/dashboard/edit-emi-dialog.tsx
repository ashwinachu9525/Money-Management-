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
import { updateEMI } from "@/actions/emis";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const emiSchema = z.object({
  isPreEmi: z.boolean(),
  name: z.string().min(2, "Loan name is required"),
  bank: z.string().min(2, "Bank name is required"),
  totalLoan: z.coerce.number().min(1, "Total loan must be greater than 0"),
  emiAmount: z.coerce.number().min(0, "EMI amount cannot be negative"),
  interestRate: z.coerce.number().min(0.1, "Interest rate is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  notes: z.string().optional(),
  
  // Pre-EMI fields
  propertyName: z.string().optional(),
  sanctionDate: z.string().optional(),
  expectedCompletion: z.string().optional(),
  builderName: z.string().optional(),
});

type EMIFormValues = z.infer<typeof emiSchema>;

export function EditEmiDialog({ emi }: { emi: any }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EMIFormValues>({
    resolver: zodResolver(emiSchema) as any,
    defaultValues: {
      isPreEmi: emi.isPreEmi || false,
      name: emi.name,
      bank: emi.bank,
      totalLoan: emi.totalLoan,
      emiAmount: emi.emiAmount,
      interestRate: emi.interestRate,
      startDate: emi.startDate ? emi.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
      endDate: emi.endDate ? emi.endDate.split("T")[0] : new Date().toISOString().split("T")[0],
      notes: emi.notes || "",
      propertyName: emi.propertyName || "",
      sanctionDate: emi.sanctionDate ? emi.sanctionDate.split("T")[0] : new Date().toISOString().split("T")[0],
      expectedCompletion: emi.expectedCompletion ? emi.expectedCompletion.split("T")[0] : new Date().toISOString().split("T")[0],
      builderName: emi.builderName || "",
    },
  });

  const isPreEmi = form.watch("isPreEmi");

  async function onSubmit(data: EMIFormValues) {
    setIsLoading(true);
    try {
      await updateEMI(emi.id, {
        ...data,
        startDate: data.startDate,
        endDate: data.endDate,
        sanctionDate: data.sanctionDate ? data.sanctionDate : undefined,
        expectedCompletion: data.expectedCompletion ? data.expectedCompletion : undefined,
      });
      toast.success("Loan details updated successfully");
      setOpen(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update loan");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 h-8 w-8" title="Edit" />
        }
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit Loan</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Loan Details</DialogTitle>
          <DialogDescription>
            Update the details of your loan or Pre-EMI tracking.
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
                      <Input placeholder="e.g. Car Loan" disabled={isLoading} {...field} />
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
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SBI" disabled={isLoading} {...field} />
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
                    <FormLabel>Total Loan Amount (₹)</FormLabel>
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
              </div>
            )}

            {!isPreEmi && (
              <>
                <div className="grid grid-cols-1 gap-4">
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
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
