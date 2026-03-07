import { ReportingPageClient } from "@/components/ReportingPageClient";
import { getParcels } from "@/lib/api";
import { getReportsByParcelIds } from "@/lib/operations";

interface ReportingPageProps {
  searchParams: Promise<{ parcel_id?: string }>;
}

export default async function ReportingPage({ searchParams }: ReportingPageProps) {
  const { parcel_id: initialParcelId } = await searchParams;
  const parcels = await getParcels();
  const reports = await getReportsByParcelIds(parcels.map((parcel) => parcel.parcel_id));

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <h1 className="text-2xl font-semibold text-slate-900">Reporting</h1>
        <p className="mt-1 text-base text-slate-500">
          Compte-rendu structuré des actions terrain, connecté au dashboard, au
          journal d&apos;activité et aux fiches parcelles.
        </p>
      </div>

      <ReportingPageClient
        parcels={parcels}
        reports={reports}
        initialParcelId={initialParcelId}
      />
    </div>
  );
}
