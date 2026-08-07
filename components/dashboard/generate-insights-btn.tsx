"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { generateFinancialInsights } from "@/actions/ai-insights";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GenerateInsightsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setIsLoading(true);
    try {
      await generateFinancialInsights();
      toast.success("AI Insights generated successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI insights. Make sure GEMINI_API_KEY is set in .env.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isLoading}
      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Analyzing Data..." : "Generate New Insights"}
    </Button>
  );
}
