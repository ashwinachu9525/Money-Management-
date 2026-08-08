import { getPastInsights } from "@/actions/ai-insights";
import { GenerateInsightsButton } from "@/components/dashboard/generate-insights-btn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, BrainCircuit, Lightbulb, Clock, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { formatDate } from "@/lib/utils";

export default async function InsightsPage() {
  const insights = await getPastInsights();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Financial Suggestions</h1>
          <p className="text-muted-foreground">
            Get short, actionable financial tips and smart suggestions based on your live cash flow.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GenerateInsightsButton label="Re-generate Suggestions" isRegenerate={true} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-none shadow-md lg:col-span-3 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BrainCircuit className="h-32 w-32" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-lg font-medium opacity-90 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-indigo-400" /> Privacy First AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-zinc-300 max-w-3xl leading-relaxed text-sm">
              Our AI analyzes only anonymized numerical summaries of your cash flow. We never send your bank account details, passwords, or personal names to AI services.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-medium flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-amber-500" /> Recent Actionable Suggestions
          </h3>
          {insights.length > 0 && (
            <GenerateInsightsButton
              label="Re-generate"
              isRegenerate={true}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            />
          )}
        </div>
        
        {insights.length > 0 ? (
          <div className="space-y-6">
            {insights.map((insight) => (
              <Card key={insight.id} className="shadow-xs border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-2.5 pt-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-row items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                    Generated {formatDate(insight.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                  </div>
                  <GenerateInsightsButton
                    label="Re-generate"
                    isRegenerate={true}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  />
                </CardHeader>
                <CardContent className="pt-4 pb-4">
                  <article className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-p:leading-snug prose-li:my-1.5 prose-li:marker:text-indigo-500">
                    <ReactMarkdown>{insight.insight}</ReactMarkdown>
                  </article>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
            <Sparkles className="h-10 w-10 text-indigo-400 mb-4" />
            <h3 className="text-lg font-medium">No suggestions generated yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Click below to generate short, actionable financial suggestions based on your current cash flow.
            </p>
            <GenerateInsightsButton label="Generate Suggestions" />
          </div>
        )}
      </div>
    </div>
  );
}
