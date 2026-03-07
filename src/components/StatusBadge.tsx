import { getOperationalStatusMeta } from "@/lib/status";
import type { ActivitySeverity } from "@/types/operations";

interface StatusBadgeProps {
  tone: ActivitySeverity;
  label?: string;
  title?: string;
}

export function StatusBadge({ tone, label, title }: StatusBadgeProps) {
  const meta = getOperationalStatusMeta(tone);

  return (
    <span
      title={title ?? meta.description}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.badgeClassName}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotClassName}`} />
      {label ?? meta.label}
    </span>
  );
}
