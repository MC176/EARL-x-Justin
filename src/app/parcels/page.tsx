import Link from "next/link";
import { OwnerFilterSelect } from "@/components/OwnerFilterSelect";
import { getOwnerOptions, getParcels } from "@/lib/api";
import { formatSurface, formatDateTime } from "@/lib/format";
import { getParcelOperationalSummaries } from "@/lib/operations";
import { getAgronomicStatusMeta } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";

interface ParcelsPageProps {
  searchParams: Promise<{ owner?: string }>;
}

export default async function ParcelsPage({ searchParams }: ParcelsPageProps) {
  const { owner } = await searchParams;
  const ownerFilter = owner ?? "";
  const owners = await getOwnerOptions();
  const [parcels, summaries] = await Promise.all([
    getParcels(ownerFilter ? { owner: ownerFilter } : {}),
    getParcelOperationalSummaries(ownerFilter ? { owner: ownerFilter } : {}),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Parcelles</h1>
            <p className="mt-1 text-base text-slate-500">
              Liste terrain enrichie avec statut métier, statut parcellaire et
              dernier signal utile.
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {parcels.length === 0 ? (
          <div className="px-4 py-6 text-base text-slate-500">
            Aucune parcelle trouvée.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {parcels.map((parcel) => (
              <li key={parcel.parcel_id}>
                <Link
                  href={`/parcels/${encodeURIComponent(parcel.idu)}`}
                  className="block px-4 py-4 transition hover:bg-slate-50"
                >
                  {(() => {
                    const summary = summaries[parcel.parcel_id];
                    const agronomicStatus = getAgronomicStatusMeta(parcel.status);

                    return (
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="text-lg font-medium text-slate-900">
                            {parcel.name || parcel.idu}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            IDU : {parcel.idu}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {parcel.commune} · {parcel.section} {parcel.numero}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            Cépage : {parcel.grape_variety || "—"} · Surface :{" "}
                            {formatSurface(parcel.area_m2)}
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 lg:items-end">
                          {summary ? (
                            <StatusBadge
                              tone={summary.tone}
                              label={summary.label}
                              title={summary.description}
                            />
                          ) : null}
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${agronomicStatus.badgeClassName}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${agronomicStatus.dotClassName}`}
                            />
                            {agronomicStatus.label}
                          </span>
                          <span className="text-sm text-slate-500">
                            {summary?.last_activity_at
                              ? `Dernière activité : ${formatDateTime(summary.last_activity_at)}`
                              : "Aucune activité récente"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
