import { getGoals } from "@/actions/goals";
import { AddGoalDialog } from "@/components/dashboard/add-goal-dialog";
import { EditGoalDialog } from "@/components/dashboard/edit-goal-dialog";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, Trophy, TrendingUp, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { MonthYearFilter } from "@/components/dashboard/month-year-filter";

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; filter?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawGoals = await getGoals();
  const goals = JSON.parse(JSON.stringify(rawGoals)) as any[];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isAllTime = resolvedSearchParams.filter === "all";
  const filterMonth = resolvedSearchParams.month ? parseInt(resolvedSearchParams.month) : currentMonth;
  const filterYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear;

  const filteredGoals = isAllTime 
    ? goals 
    : goals.filter(g => {
        const start = new Date(g.startDate);
        const target = new Date(g.targetDate);
        const filterStart = new Date(filterYear, filterMonth, 1);
        const filterEnd = new Date(filterYear, filterMonth + 1, 0, 23, 59, 59);
        return start <= filterEnd && target >= filterStart;
      });

  const totalTarget = filteredGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = filteredGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">
            Set targets, save money, and track your progress to financial freedom.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthYearFilter />
          <AddGoalDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-none shadow-md lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Overall Savings Progress</CardTitle>
            <Trophy className="h-4 w-4 opacity-75" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
              <div>
                <div className="text-4xl font-bold">
                  ₹{totalSaved.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  <span className="text-lg opacity-75 font-normal"> / ₹{totalTarget.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                </div>
                <p className="text-sm opacity-80 mt-1">Total saved across {filteredGoals.length} {isAllTime ? '' : 'active'} goals</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div>
                <p className="text-sm opacity-80">completed</p>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3 bg-white/20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {filteredGoals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const daysLeft = differenceInDays(new Date(goal.targetDate), new Date());
          const remainingAmount = goal.targetAmount - goal.currentAmount;
          
          return (
            <Card key={goal.id} className="relative overflow-hidden group hover:shadow-md transition-shadow border-zinc-200 dark:border-zinc-800 flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full font-medium ${
                      goal.priority === 'HIGH' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                      goal.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {goal.priority} PRIORITY
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <EditGoalDialog goal={goal} />
                    <DeleteButton id={goal.id} itemType="Goal" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{goal.currentAmount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      of ₹{goal.targetAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <Progress value={progress} className="h-2 mb-1" />
                  <div className="text-right text-xs font-medium text-muted-foreground">
                    {progress.toFixed(1)}%
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Left to Save</p>
                    <p className="text-sm font-medium">₹{remainingAmount > 0 ? remainingAmount.toLocaleString("en-IN") : '0'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-end">
                      <Clock className="h-3 w-3 mr-1" /> Time Left
                    </p>
                    <p className={`text-sm font-medium ${daysLeft < 30 ? 'text-rose-500' : ''}`}>
                      {daysLeft > 0 ? `${daysLeft} days` : 'Overdue'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <Target className="h-10 w-10 text-zinc-400 mb-4" />
            <h3 className="text-lg font-medium">No financial goals</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              Setting goals is the first step in turning the invisible into the visible. Start by adding an emergency fund!
            </p>
            <AddGoalDialog />
          </div>
        )}
      </div>
    </div>
  );
}
