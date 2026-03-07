import { ActivityFeed } from "@/components/ActivityFeed";
import type { ActivityFeedItem } from "@/types/operations";

interface DashboardRecentActivityProps {
  items: ActivityFeedItem[];
}

export function DashboardRecentActivity({
  items,
}: DashboardRecentActivityProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Fil terrain</h2>
        <p className="mt-1 text-base text-slate-500">
          Actions récentes sur les parcelles.
        </p>
      </div>

      <ActivityFeed
        items={items}
        emptyMessage="Aucune activité récente à afficher."
      />
    </section>
  );
}
