import { getPastInsights } from "@/actions/ai-insights";
import { GenerateInsightsButton } from "@/components/dashboard/generate-insights-btn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BrainCircuit, Lightbulb, Clock } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

export default async function InsightsPage() {
  const insights = await getPastInsights();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground">
            Get personalized, AI-driven analysis on your spending and saving habits.
          </p>
        </div>
        <GenerateInsightsButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-none shadow-md lg:col-span-3 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BrainCircuit className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-lg font-medium opacity-90 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-indigo-400" /> Privacy First AI
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-zinc-300 max-w-3xl leading-relaxed">
              Our AI analysis is completely anonymized. We never send your personal information, bank account numbers, passwords, or names to the AI provider. Only aggregated, numerical summaries of your cash flow and categories are analyzed to give you the best recommendations.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-amber-500" /> Recent Insights
        </h3>
        
        {insights.length > 0 ? (
          <div className="space-y-6">
            {insights.map((insight) => (
              <Card key={insight.id} className="shadow-sm border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    Generated on {format(new Date(insight.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <article className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:marker:text-indigo-500">
                    <ReactMarkdown>{insight.insight}</ReactMarkdown>
                  </article>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <Sparkles className="h-10 w-10 text-indigo-400 mb-4" />
            <h3 className="text-lg font-medium">No insights generated</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Click the button above to generate your first AI-driven financial analysis based on your current data.
            </p>
            <GenerateInsightsButton />
          </div>
        )}
      </div>
    </div>
  );
}
