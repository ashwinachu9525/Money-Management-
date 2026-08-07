import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreditCardList } from "@/components/dashboard/credit-card-list";
import { AddCreditCardDialog } from "@/components/dashboard/add-credit-card-dialog";

export default async function CreditCardsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const creditCards = await prisma.creditCard.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      statements: {
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
        ],
      },
    },
  });

  const totalLimit = creditCards.reduce((acc, card) => acc + card.creditLimit, 0);
  
  // Calculate total utilized (based on latest statements)
  const totalUtilized = creditCards.reduce((acc, card) => {
    const latestStatement = card.statements[0];
    return acc + (latestStatement ? latestStatement.statementAmount : 0);
  }, 0);

  const overallUtilization = totalLimit > 0 ? (totalUtilized / totalLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
          <p className="text-muted-foreground">
            Manage your credit cards, track utilization, and pay statements.
          </p>
        </div>
        <AddCreditCardDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Credit Limit</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">₹{totalLimit.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Utilized</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">₹{totalUtilized.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Overall Utilization</h3>
          </div>
          <div className="p-6 pt-0">
            <div className={`text-2xl font-bold ${overallUtilization > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {overallUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallUtilization > 30 ? 'Try to keep it under 30%' : 'Excellent utilization rate'}
            </p>
          </div>
        </div>
      </div>

      <CreditCardList cards={creditCards} />
    </div>
  );
}
