"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (format: "excel" | "csv") => {
    setIsExporting(true);
    // Open API route in new tab/window which triggers download
    window.open(`/api/export?format=${format}`, '_blank');
    
    // Reset state after a short delay
    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3" disabled={isExporting}>
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Exporting..." : "Export"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
