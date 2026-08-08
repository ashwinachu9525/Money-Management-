"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { 
  Building2, 
  CheckCircle2, 
  CircleDashed, 
  Clock, 
  TrendingUp,
  Banknote,
  Plus
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EditEmiDialog } from "@/components/dashboard/edit-emi-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { updateDisbursementSlab, convertToRegularEMI } from "@/actions/emis";
import { AddSlabDialog } from "@/components/dashboard/add-slab-dialog";

type SerializedDisbursementSlab = {
  id: string;
  emiId: string;
  slabNumber: number;
  amount: number;
  constructionStage: string;
  status: string;
  releaseDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type SerializedEMI = {
  id: string;
  name: string;
  bank: string;
  builderName: string | null;
  propertyName: string | null;
  totalLoan: number;
  emiAmount: number;
  remainingMonths: number;
  interestRate: number;
  isPreEmi: boolean;
  notes: string | null;
  startDate: string;
  endDate: string;
  sanctionDate: string | null;
  expectedCompletion: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type PreEmiWithSlabs = SerializedEMI & { slabs: SerializedDisbursementSlab[] };

export function PreEmiCard({ emi }: { emi: PreEmiWithSlabs }) {
  const [isPending, startTransition] = useTransition();

  // Sort slabs ascending by slabNumber so Slab 1, Slab 2, Slab 3 display sequentially
  const sortedSlabs = [...(emi.slabs || [])].sort((a, b) => a.slabNumber - b.slabNumber);

  const totalDisbursed = sortedSlabs
    .filter((s) => s.status === "DISBURSED")
    .reduce((sum, slab) => sum + slab.amount, 0);

  const percentDisbursed = Math.min((totalDisbursed / emi.totalLoan) * 100, 100);
  
  // Auto-calculated Pre-EMI (Monthly Interest on Disbursed Amount)
  const monthlyPreEmi = (totalDisbursed * (emi.interestRate / 100)) / 12;

  const handleMarkDisbursed = (slabId: string) => {
    startTransition(async () => {
      try {
        await updateDisbursementSlab(slabId, {
          status: "DISBURSED",
          releaseDate: new Date().toISOString(),
        });
        toast.success("Slab marked as disbursed");
      } catch (error) {
        toast.error("Failed to update slab");
      }
    });
  };

  const handleConvertToEMI = () => {
    if (totalDisbursed < emi.totalLoan) {
      toast.error("Cannot convert to EMI before full disbursement");
      return;
    }

    startTransition(async () => {
      try {
        const principal = emi.totalLoan;
        const rate = emi.interestRate / 12 / 100;
        const months = 240; // 20 years default
        
        const calculatedEmi = 
          (principal * rate * Math.pow(1 + rate, months)) / 
          (Math.pow(1 + rate, months) - 1);

        const now = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 20);

        await convertToRegularEMI(emi.id, {
          emiAmount: calculatedEmi,
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
        });
        toast.success("Successfully converted to Regular EMI");
      } catch (error) {
        toast.error("Failed to convert loan");
      }
    });
  };

  const nextSlabNumber = sortedSlabs.length > 0 
    ? Math.max(...sortedSlabs.map((s) => s.slabNumber)) + 1 
    : 1;

  return (
    <Card className="flex flex-col relative overflow-hidden group border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Building2 className="h-32 w-32" />
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                Pre-EMI Construction Loan
              </Badge>
              <CardTitle className="text-xl font-bold truncate">{emi.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {emi.propertyName} {emi.builderName ? `• ${emi.builderName}` : ""}
            </p>
          </div>
          <div className="flex space-x-1 shrink-0">
            <EditEmiDialog emi={emi} />
            <DeleteButton id={emi.id} itemType="Pre-EMI Loan" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4 relative z-10 space-y-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3.5 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Current Pre-EMI</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                ₹{monthlyPreEmi.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">/mo</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Interest Rate</p>
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-base sm:text-lg font-semibold">{emi.interestRate}% p.a.</span>
            </div>
          </div>
        </div>

        {/* Disbursement Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="font-medium text-muted-foreground">Disbursement Progress</span>
            <span className="font-semibold text-right">
              ₹{totalDisbursed.toLocaleString("en-IN")} / ₹{emi.totalLoan.toLocaleString("en-IN")}
            </span>
          </div>
          <Progress value={percentDisbursed} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentDisbursed.toFixed(1)}% Disbursed</span>
            <span>{sortedSlabs.filter((s) => s.status === "DISBURSED").length} of {sortedSlabs.length} Slabs Released</span>
          </div>
        </div>

        {/* Disbursement Slabs List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center">
              <Clock className="h-4 w-4 mr-2 text-amber-500" />
              Disbursement Slabs ({sortedSlabs.length})
            </h4>
          </div>

          <div className="space-y-3">
            {sortedSlabs.length > 0 ? (
              sortedSlabs.map((slab) => (
                <div
                  key={slab.id}
                  className={`p-3.5 rounded-xl border shadow-xs transition-colors ${
                    slab.status === "DISBURSED"
                      ? "border-l-4 border-l-emerald-500 border-zinc-200 dark:border-zinc-800 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : "border-l-4 border-l-amber-400 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        Slab {slab.slabNumber}
                      </span>
                      <p className="text-sm font-semibold text-foreground truncate">{slab.constructionStage}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground shrink-0">
                      ₹{slab.amount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {slab.status === "DISBURSED" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            Released {slab.releaseDate ? format(new Date(slab.releaseDate), "PP") : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          <CircleDashed className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Pending Release</span>
                        </>
                      )}
                    </div>

                    {slab.status === "PENDING" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-3 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300/40"
                        disabled={isPending}
                        onClick={() => handleMarkDisbursed(slab.id)}
                      >
                        Mark Released
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center border border-dashed rounded-xl bg-zinc-50 dark:bg-zinc-900/40 text-xs text-muted-foreground">
                No disbursement slabs added yet. Click below to add your first slab.
              </div>
            )}
          </div>
          
          <AddSlabDialog emiId={emi.id} nextSlabNumber={nextSlabNumber} />
        </div>
      </CardContent>

      {percentDisbursed >= 100 && (
        <CardFooter className="bg-emerald-50 dark:bg-emerald-950/20 border-t border-emerald-100 dark:border-emerald-900 mt-auto pt-4 relative z-10">
          <div className="flex flex-col w-full items-center text-center space-y-3">
            <div className="flex items-center text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span className="font-medium text-sm">Full Loan Disbursed</span>
            </div>
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={handleConvertToEMI}
              disabled={isPending}
            >
              <Banknote className="mr-2 h-4 w-4" />
              Convert to Regular EMI
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
