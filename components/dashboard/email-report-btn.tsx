"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { sendMonthlyReportViaEmail } from "@/actions/email-reports";
import { toast } from "sonner";

interface EmailReportButtonProps {
  month: number;
  year: number;
}

export function EmailReportButton({ month, year }: EmailReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = async () => {
    setIsLoading(true);
    try {
      const result = await sendMonthlyReportViaEmail(month, year);
      if (result.success) {
        toast.success(`Monthly financial report successfully emailed to ${result.recipient}!`);
      } else {
        toast.error(result.error || "Failed to send email report");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while sending email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendEmail}
      disabled={isLoading}
      variant="outline"
      className="gap-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      ) : (
        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      )}
      {isLoading ? "Sending Email..." : "Email Report"}
    </Button>
  );
}
