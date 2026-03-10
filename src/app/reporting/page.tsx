import { ReportingPageClient } from "@/components/ReportingPageClient";
import { OwnerFilterSelect } from "@/components/OwnerFilterSelect";
import { getOwnerOptions, getParcels } from "@/lib/api";
import { getReportsByParcelIds } from "@/lib/operations";

interface ReportingPageProps {
  searchParams: Promise<{ parcel_id?: string; owner?: string }>;
}

export default async function ReportingPage({ searchParams }: ReportingPageProps) {
  const { parcel_id: initialParcelId, owner } = await searchParams;
  const ownerFilter = owner ?? "";
  const owners = await getOwnerOptions();
  const parcels = await getParcels(ownerFilter ? { owner: ownerFilter } : {});
  const reports = await getReportsByParcelIds(parcels.map((parcel) => parcel.parcel_id));

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Reporting</h1>
            <p className="mt-1 text-base text-slate-500">
              Compte-rendu structuré des actions terrain, connecté au dashboard, au
              journal d&apos;activité et aux fiches parcelles.
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
      </div>

      <ReportingPageClient
        parcels={parcels}
        reports={reports}
        initialParcelId={initialParcelId}
      />
    </div>
  );
}
