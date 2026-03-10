"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface OwnerFilterOption {
  value: string;
  label: string;
}

interface OwnerFilterSelectProps {
  value?: string;
  options: OwnerFilterOption[];
  paramName?: string;
  className?: string;
}

export function OwnerFilterSelect({
  value,
  options,
  paramName = "owner",
  className,
}: OwnerFilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentValue = value ?? searchParams.get(paramName) ?? "";

  const mergedOptions = useMemo(() => {
    const withAll = [{ value: "", label: "Tous" }, ...options];
    const seen = new Set<string>();
    return withAll.filter((opt) => {
      const key = `${opt.value}::${opt.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [options]);

  return (
    <select
      value={currentValue}
      onChange={(e) => {
        const nextValue = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (!nextValue) {
          params.delete(paramName);
        } else {
          params.set(paramName, nextValue);
        }

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
        router.refresh();
      }}
      className={
        className ??
        "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
      }
      aria-label="Filtrer par exploitant"
    >
      {mergedOptions.map((option) => (
        <option key={`${option.value}-${option.label}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

