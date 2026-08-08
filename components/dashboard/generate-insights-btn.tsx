"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { generateFinancialInsights } from "@/actions/ai-insights";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GenerateInsightsButtonProps {
  label?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  isRegenerate?: boolean;
}

export function GenerateInsightsButton({
  label = "Generate New Suggestions",
  variant = "default",
  size = "default",
  className,
  isRegenerate = false,
}: GenerateInsightsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setIsLoading(true);
    try {
      await generateFinancialInsights();
      toast.success(isRegenerate ? "AI Suggestions re-generated!" : "AI Suggestions generated successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI insights. Make sure GEMINI_API_KEY is set in .env.");
    } finally {
      setIsLoading(false);
    }
  }

  const defaultClasses = "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-md gap-2 font-semibold";

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className || defaultClasses}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRegenerate ? (
        <RefreshCw className="h-4 w-4 text-purple-400" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {isLoading ? "Analyzing Data..." : label}
    </Button>
  );
}
