"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function MonthYearFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isAllTime = searchParams.get("filter") === "all";
  const urlMonth = searchParams.get("month");
  const urlYear = searchParams.get("year");

  const currentMonth = new Date().getMonth().toString();
  const currentYear = new Date().getFullYear().toString();

  const selectedMonth = isAllTime ? "all" : (urlMonth || currentMonth);
  const selectedYear = isAllTime ? "all" : (urlYear || currentYear);

  const years = [];
  const startYear = 2020;
  const endYear = new Date().getFullYear() + 5;
  for (let y = startYear; y <= endYear; y++) {
    years.push(y.toString());
  }

  const handleMonthChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.set("filter", "all");
      params.delete("month");
      params.delete("year");
    } else {
      params.delete("filter");
      params.set("month", value);
      if (selectedYear === "all") {
        params.set("year", currentYear);
      } else {
        params.set("year", selectedYear);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleYearChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.set("filter", "all");
      params.delete("month");
      params.delete("year");
    } else {
      params.delete("filter");
      params.set("year", value);
      if (selectedMonth === "all") {
        params.set("month", currentMonth);
      } else {
        params.set("month", selectedMonth);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedMonth} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Select Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {MONTHS.map((m, i) => (
            <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px] h-9">
          <SelectValue placeholder="Select Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          {years.map(y => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
