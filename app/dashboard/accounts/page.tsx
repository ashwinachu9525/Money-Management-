import { getBankAccounts } from "@/actions/bank-accounts";
import { AddAccountDialog } from "@/components/dashboard/add-account-dialog";
import { EditAccountDialog } from "@/components/dashboard/edit-account-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, CreditCard, Building } from "lucide-react";

export default async function AccountsPage() {
  const rawAccounts = await getBankAccounts();
  const accounts = JSON.parse(JSON.stringify(rawAccounts)) as any[];
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts and view balances. (Max 10)
          </p>
        </div>
        {accounts.length < 10 && <AddAccountDialog />}
      </div>

      {accounts.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-md mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Total Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-80 mt-1">Across {accounts.length} accounts</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Building className="h-16 w-16" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{account.bankName}</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    {account.accountType}
                  </span>
                  <EditAccountDialog account={account} />
                  <DeleteButton id={account.id} itemType="Account" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {account.accountNick}
              </p>
            </CardHeader>
            <CardContent>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ending •••••{account.last5Digits}
                </div>
                <div className="text-2xl font-bold">
                  ₹{account.balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <PiggyBank className="h-10 w-10 text-zinc-400 mb-4" />
            <h3 className="text-lg font-medium">No accounts added</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              You haven't added any bank accounts yet. Add an account to start tracking your balances.
            </p>
            <AddAccountDialog />
          </div>
        )}
      </div>
    </div>
  );
}
