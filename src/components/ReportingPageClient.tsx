"use client";

import { ParcelReportsList } from "@/components/ParcelReportsList";
import { ReportingForm } from "@/components/ReportingForm";
import type { Parcel } from "@/types/parcel";
import type { ParcelReport } from "@/types/operations";

interface ReportingPageClientProps {
  parcels: Parcel[];
  reports: ParcelReport[];
  initialParcelId?: string;
}

export function ReportingPageClient({
  parcels,
  reports,
  initialParcelId,
}: ReportingPageClientProps) {
  const parcelsById = parcels.reduce<Record<string, Parcel>>((accumulator, parcel) => {
    accumulator[parcel.parcel_id] = parcel;
    return accumulator;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <ReportingForm
          parcels={parcels}
          reports={reports}
          initialParcelId={initialParcelId}
        />

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Derniers reportings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Historique récent des comptes-rendus terrain.
            </p>
          </div>

          <ParcelReportsList
            reports={reports.slice(0, 8)}
            parcelsById={parcelsById}
            emptyMessage="Aucun reporting récent."
          />
        </section>
      </div>
    </div>
  );
}
