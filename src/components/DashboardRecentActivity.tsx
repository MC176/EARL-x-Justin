import { ActivityFeed } from "@/components/ActivityFeed";
import type { ActivityFeedItem } from "@/types/operations";

interface DashboardRecentActivityProps {
  items: ActivityFeedItem[];
}

export function DashboardRecentActivity({
  items,
}: DashboardRecentActivityProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Activité récente
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Journal chronologique des dernières actions terrain.
        </p>
      </div>

      <ActivityFeed
        items={items}
        emptyMessage="Aucune activité récente à afficher."
      />
    </section>
  );
}
