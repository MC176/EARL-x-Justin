import Link from "next/link";
import { formatDate, formatTimeRange } from "@/lib/format";
import type { Parcel } from "@/types/parcel";
import type { ParcelIntervention } from "@/types/operations";

interface ParcelInterventionsListProps {
  interventions: ParcelIntervention[];
  parcelsById?: Record<string, Parcel>;
  emptyMessage?: string;
}

export function ParcelInterventionsList({
  interventions,
  parcelsById,
  emptyMessage = "Aucune intervention enregistrée.",
}: ParcelInterventionsListProps) {
  if (interventions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {interventions.map((intervention) => {
        const parcel = parcelsById?.[intervention.parcel_id];
        const content = (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white">
                    {intervention.intervention_type}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(intervention.date)}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  {intervention.author_name}
                </p>
                <p className="text-sm text-slate-600">
                  {formatTimeRange(
                    intervention.start_time,
                    intervention.end_time,
                  )}
                </p>
                {intervention.comment ? (
                  <p className="text-sm text-slate-600">{intervention.comment}</p>
                ) : null}
              </div>

              {parcel ? (
                <div className="shrink-0 text-xs text-slate-500 sm:text-right">
                  <div>{parcel.name || parcel.idu}</div>
                  <div className="mt-1">IDU {parcel.idu}</div>
                </div>
              ) : null}
            </div>
          </div>
        );

        return (
          <li key={intervention.id}>
            {parcel ? (
              <Link
                href={`/parcels/${encodeURIComponent(parcel.idu)}`}
                className="block"
              >
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
