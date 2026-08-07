import { getEMIs } from "@/actions/emis";
import { AddEMIDialog } from "@/components/dashboard/add-emi-dialog";
import { EditEmiDialog } from "@/components/dashboard/edit-emi-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { PreEmiCard } from "@/components/dashboard/pre-emi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Landmark, Calendar as CalendarIcon, Percent, AlertCircle, Building2 } from "lucide-react";
import { format } from "date-fns";

export default async function EMIPage() {
  const rawEmis = await getEMIs();
  const allEmis = JSON.parse(JSON.stringify(rawEmis)) as any[];
  
  const regularEmis = allEmis.filter((emi) => !emi.isPreEmi);
  const preEmis = allEmis.filter((emi) => emi.isPreEmi);

  const totalMonthlyEMI = regularEmis.reduce((sum, emi) => sum + emi.emiAmount, 0);
  const totalRemainingLoan = regularEmis.reduce((sum, emi) => sum + (emi.emiAmount * emi.remainingMonths), 0);

  // Calculate current total Pre-EMI payments across all Pre-EMI loans
  const totalPreEmiPayments = preEmis.reduce((sum, emi) => {
    const totalDisbursed = emi.slabs
      .filter(s => s.status === "DISBURSED")
      .reduce((s, slab) => s + slab.amount, 0);
    return sum + ((totalDisbursed * (emi.interestRate / 100)) / 12);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EMI & Loans</h1>
          <p className="text-muted-foreground">
            Track your ongoing loans, EMIs, and construction-linked Pre-EMIs.
          </p>
        </div>
        <AddEMIDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Regular EMI</CardTitle>
            <CreditCard className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{totalMonthlyEMI.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm opacity-80 mt-1">Across {regularEmis.length} active loans</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-zinc-800 to-zinc-950 text-white border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Current Pre-EMI</CardTitle>
            <Landmark className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">
              ₹{totalPreEmiPayments.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm opacity-80 mt-1">Across {preEmis.length} construction stages</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimated Remaining</CardTitle>
            <Landmark className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
              ₹{totalRemainingLoan.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total outstanding amount</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="regular" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:max-w-[400px]">
          <TabsTrigger value="regular">Regular EMIs ({regularEmis.length})</TabsTrigger>
          <TabsTrigger value="pre-emi">Pre-EMIs ({preEmis.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regular" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {regularEmis.map((emi) => (
              <Card key={emi.id} className="relative overflow-hidden group hover:shadow-md transition-shadow border-zinc-200 dark:border-zinc-800">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <CreditCard className="h-24 w-24" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{emi.name}</CardTitle>
                      <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center">
                        <Landmark className="h-3 w-3 mr-1" />
                        {emi.bank}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-right">
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-500">
                        ₹{emi.emiAmount.toLocaleString("en-IN")} <span className="text-xs text-muted-foreground font-normal">/mo</span>
                      </div>
                      <div className="flex space-x-1">
                        <EditEmiDialog emi={emi} />
                        <DeleteButton id={emi.id} itemType="EMI" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mt-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 relative z-10">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Loan</p>
                      <p className="text-sm font-medium">₹{emi.totalLoan.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center">
                        <Percent className="h-3 w-3 mr-1" /> Interest Rate
                      </p>
                      <p className="text-sm font-medium">{emi.interestRate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                      <p className="text-sm font-medium flex items-center text-amber-600 dark:text-amber-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {emi.remainingMonths} months
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" /> Ends On
                      </p>
                      <p className="text-sm font-medium">{format(new Date(emi.endDate), "MMM yyyy")}</p>
                    </div>
                  </div>
                  {emi.notes && (
                    <p className="mt-4 text-xs text-zinc-500 bg-white dark:bg-zinc-950 p-2 rounded border relative z-10">
                      {emi.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}

            {regularEmis.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <CreditCard className="h-10 w-10 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">No active Regular EMIs</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  You haven't added any ongoing standard loans. Add one to track your liabilities.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pre-emi" className="pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {preEmis.map((emi) => (
              <PreEmiCard key={emi.id} emi={emi} />
            ))}

            {preEmis.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                <Building2 className="h-10 w-10 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">No Pre-EMI Loans</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  Construction-linked loans will appear here. You can track disbursement slabs and calculate interest automatically.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
