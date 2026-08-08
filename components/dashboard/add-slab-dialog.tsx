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
import { addDisbursementSlab } from "@/actions/emis";
import { Textarea } from "@/components/ui/textarea";

const slabSchema = z.object({
  slabNumber: z.coerce.number().min(1, "Slab number must be at least 1"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  constructionStage: z.string().min(2, "Stage name is required"),
  remarks: z.string().optional(),
});

type SlabFormValues = z.infer<typeof slabSchema>;

export function AddSlabDialog({ emiId, nextSlabNumber }: { emiId: string; nextSlabNumber: number }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SlabFormValues>({
    resolver: zodResolver(slabSchema),
    defaultValues: {
      slabNumber: nextSlabNumber,
      amount: 0,
      constructionStage: "",
      remarks: "",
    },
  });

  async function onSubmit(data: SlabFormValues) {
    setIsLoading(true);
    try {
      await addDisbursementSlab(emiId, {
        ...data,
        status: "PENDING",
      });
      toast.success("Disbursement slab added successfully");
      setOpen(false);
      form.reset({
        ...form.getValues(),
        slabNumber: data.slabNumber + 1,
        amount: 0,
        constructionStage: "",
        remarks: "",
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to add slab");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="mt-4" />
        }
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Disbursement Slab
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Disbursement Slab</DialogTitle>
          <DialogDescription>
            Schedule a future disbursement based on construction progress.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="slabNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slab Number</FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <FormField
              control={form.control}
              name="constructionStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Construction Stage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ground Floor Roof Cast" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any notes about this stage..." disabled={isLoading} {...field} />
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
                Add Slab
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
