import { ActivityFeed } from "@/components/ActivityFeed";
import { OwnerFilterSelect } from "@/components/OwnerFilterSelect";
import { getOwnerOptions } from "@/lib/api";
import { getDashboardData } from "@/lib/operations";

interface JournalPageProps {
  searchParams: Promise<{ owner?: string }>;
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { owner } = await searchParams;
  const ownerFilter = owner ?? "";
  const owners = await getOwnerOptions();
  const dashboard = await getDashboardData(ownerFilter ? { owner: ownerFilter } : {});

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Journal</h1>
            <p className="mt-1 text-base text-slate-500">
              Fil d&apos;activité terrain en temps réel.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Exploitant
            </label>
            <OwnerFilterSelect
              value={ownerFilter}
              options={owners.map((o) => ({
                value: o.owner_code,
                label: o.owner_name,
              }))}
            />
          </div>
        </div>
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
