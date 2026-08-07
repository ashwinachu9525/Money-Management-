"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { 
  Building2, 
  CheckCircle2, 
  CircleDashed, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Banknote
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EditEmiDialog } from "@/components/dashboard/edit-emi-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { deleteEMI, updateDisbursementSlab, convertToRegularEMI } from "@/actions/emis";
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

  const totalDisbursed = emi.slabs
    .filter(s => s.status === "DISBURSED")
    .reduce((sum, slab) => sum + slab.amount, 0);

  const percentDisbursed = (totalDisbursed / emi.totalLoan) * 100;
  
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

    // In a real scenario, you'd open a dialog to confirm the final start date, tenure, etc.
    // For now, we'll auto-calculate a standard 20-year term to demonstrate.
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

  const nextSlabNumber = emi.slabs.length > 0 
    ? Math.max(...emi.slabs.map(s => s.slabNumber)) + 1 
    : 1;

  return (
    <Card className="flex flex-col relative overflow-hidden group border-zinc-200 dark:border-zinc-800">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Building2 className="h-32 w-32" />
      </div>
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                Pre-EMI
              </Badge>
              <CardTitle className="text-xl">{emi.name}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {emi.propertyName} {emi.builderName ? `• ${emi.builderName}` : ""}
            </p>
          </div>
          <div className="flex space-x-1">
            <EditEmiDialog emi={emi} />
            <DeleteButton id={emi.id} itemType="Pre-EMI Loan" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4 relative z-10 space-y-6">
        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Current Pre-EMI</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                ₹{monthlyPreEmi.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Interest Rate</p>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-lg font-semibold">{emi.interestRate}%</span>
            </div>
          </div>
        </div>

        {/* Disbursement Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-muted-foreground">Disbursement Progress</span>
            <span className="font-semibold">
              ₹{totalDisbursed.toLocaleString("en-IN")} / ₹{emi.totalLoan.toLocaleString("en-IN")}
            </span>
          </div>
          <Progress value={percentDisbursed} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentDisbursed.toFixed(1)}% Disbursed</span>
            <span>{emi.slabs.filter(s => s.status === "DISBURSED").length} Slabs Completed</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-semibold flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            Disbursement Timeline
          </h4>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
            {emi.slabs.map((slab) => (
              <div key={slab.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  {slab.status === "DISBURSED" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Slab {slab.slabNumber}
                    </span>
                    <span className="text-sm font-bold">₹{slab.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-sm font-medium">{slab.constructionStage}</p>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {slab.status === "DISBURSED" 
                        ? `Released on ${slab.releaseDate ? format(new Date(slab.releaseDate), "PP") : "Unknown"}`
                        : "Pending Release"
                      }
                    </span>
                    {slab.status === "PENDING" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs"
                        disabled={isPending}
                        onClick={() => handleMarkDisbursed(slab.id)}
                      >
                        Mark Released
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
