import { ActivityFeed } from "@/components/ActivityFeed";
import { getDashboardData } from "@/lib/operations";

export default async function JournalPage() {
  const dashboard = await getDashboardData({ owner: "maxime" });

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <h1 className="text-2xl font-semibold text-slate-900">Journal</h1>
        <p className="mt-1 text-base text-slate-500">
          Fil d&apos;activité terrain en temps réel.
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <ActivityFeed
          items={dashboard.recentActivity}
          emptyMessage="Aucune activité récente."
        />
      </section>
    </div>
  );
}
