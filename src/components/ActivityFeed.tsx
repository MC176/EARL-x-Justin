import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { ActivityFeedItem } from "@/types/operations";

interface ActivityFeedProps {
  items: ActivityFeedItem[];
  emptyMessage?: string;
}

export function ActivityFeed({
  items,
  emptyMessage = "Aucune activité pour le moment.",
}: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const content = (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={item.severity} />
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {item.event_type}
                  </span>
                  {item.state_label ? (
                    <span className="text-xs text-slate-500">{item.state_label}</span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                {item.description ? (
                  <p className="text-sm text-slate-600">{item.description}</p>
                ) : null}
              </div>

              <div className="shrink-0 text-xs text-slate-500 sm:text-right">
                <div>{item.parcel_label}</div>
                <div className="mt-1">{formatDateTime(item.created_at)}</div>
              </div>
            </div>
          </div>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="block">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
