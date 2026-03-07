import { ActivityFeed } from "@/components/ActivityFeed";
import type { ActivityFeedItem } from "@/types/operations";

interface ParcelTimelineProps {
  items: ActivityFeedItem[];
}

export function ParcelTimeline({ items }: ParcelTimelineProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Journal de la parcelle
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Timeline agrégée des interventions, commentaires, reportings et événements.
        </p>
      </div>

      <ActivityFeed
        items={items}
        emptyMessage="Aucune activité enregistrée pour cette parcelle."
      />
    </section>
  );
}
