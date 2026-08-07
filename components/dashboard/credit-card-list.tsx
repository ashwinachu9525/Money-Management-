"use client";

import { useState } from "react";
import { CreditCard, Landmark, Calendar, IndianRupee, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatementDialog } from "./statement-dialog";
import { deleteCreditCard } from "@/actions/credit-cards";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CreditCardListProps {
  cards: any[];
}

export function CreditCardList({ cards }: CreditCardListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const result = await deleteCreditCard(id);
      if (result.success) {
        toast.success("Credit card deleted");
      } else {
        toast.error("Failed to delete credit card");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CreditCard className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium">No credit cards found</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
          Add your first credit card to start tracking statements and utilization.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        // Find latest statement
        const latestStatement = card.statements.length > 0 
          ? card.statements.sort((a: any, b: any) => {
              if (a.year !== b.year) return b.year - a.year;
              return b.month - a.month;
            })[0]
          : null;

        const currentUtilization = latestStatement ? (latestStatement.statementAmount / card.creditLimit) * 100 : 0;
        
        return (
          <Card key={card.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-4 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center">
                    <Landmark className="mr-2 h-5 w-5 text-blue-500" />
                    {card.bank}
                  </CardTitle>
                  <CardDescription className="mt-1 font-medium">{card.name}</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono bg-white dark:bg-zinc-800">
                  •••• {card.last4Digits}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-4 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Credit Utilization</span>
                  <span className="font-medium">
                    {latestStatement ? `₹${latestStatement.statementAmount.toLocaleString('en-IN')}` : '₹0'} / ₹{card.creditLimit.toLocaleString('en-IN')}
                  </span>
                </div>
                <Progress 
                  value={Math.min(currentUtilization, 100)} 
                  className={`h-2 ${currentUtilization > 80 ? 'bg-red-100 dark:bg-red-950' : currentUtilization > 30 ? 'bg-amber-100 dark:bg-amber-950' : 'bg-blue-100 dark:bg-blue-950'}`}
                  indicatorClassName={`${currentUtilization > 80 ? 'bg-red-500' : currentUtilization > 30 ? 'bg-amber-500' : 'bg-blue-500'}`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{currentUtilization.toFixed(1)}%</span>
                  {currentUtilization > 30 && (
                    <span className="text-xs text-amber-500 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Keep under 30% for optimal score
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                  <span className="text-muted-foreground block text-xs mb-1">Billing Date</span>
                  <span className="font-medium flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
                    {card.billingCycleDate}th of month
                  </span>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg">
                  <span className="text-muted-foreground block text-xs mb-1">Due Date</span>
                  <span className="font-medium flex items-center text-red-500">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {card.dueDate}th of month
                  </span>
                </div>
              </div>

              {latestStatement && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center">
                    Latest Statement 
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      ({format(new Date(latestStatement.year, latestStatement.month - 1), 'MMM yyyy')})
                    </span>
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={latestStatement.status === 'PENDING' ? 'destructive' : 'default'} className={latestStatement.status === 'PAID_FULL' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                        {latestStatement.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Minimum Due</span>
                      <span className="font-medium">₹{latestStatement.minimumDue.toLocaleString('en-IN')}</span>
                    </div>
                    {latestStatement.status === 'PENDING' && (
                      <div className="pt-2">
                        <StatementDialog 
                          creditCardId={card.id} 
                          statement={latestStatement} 
                          trigger={
                            <Button className="w-full" size="sm" variant="outline">
                              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                              Mark as Paid
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-between">
              <StatementDialog creditCardId={card.id} />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the credit card and all its statements.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(card.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
