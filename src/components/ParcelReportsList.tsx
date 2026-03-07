import Link from "next/link";
import { formatDate, formatDateTime, formatTimeRange } from "@/lib/format";
import { getReportStatusMeta } from "@/lib/status";
import type { Parcel } from "@/types/parcel";
import type { ParcelReport } from "@/types/operations";

interface ParcelReportsListProps {
  reports: ParcelReport[];
  parcelsById?: Record<string, Parcel>;
  emptyMessage?: string;
}

export function ParcelReportsList({
  reports,
  parcelsById,
  emptyMessage = "Aucun reporting enregistré.",
}: ParcelReportsListProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => {
        const parcel = parcelsById?.[report.parcel_id];
        const statusMeta = getReportStatusMeta(report.status);
        const content = (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClassName}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${statusMeta.dotClassName}`} />
                    {statusMeta.label}
                  </span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white">
                    {report.report_type}
                  </span>
                  <span className="text-sm font-medium text-slate-900">
                    {report.author_name}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {report.summary}
                </p>

                {report.details ? (
                  <p className="text-sm text-slate-600">{report.details}</p>
                ) : null}

                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{formatDate(report.date)}</span>
                  <span>{formatTimeRange(report.start_time, report.end_time)}</span>
                  <span>Saisi le {formatDateTime(report.created_at)}</span>
                  {report.is_active ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1">
                      Élément actif
                    </span>
                  ) : null}
                  {!report.is_active && report.closed_at ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                      Clôturé le {formatDateTime(report.closed_at)}
                    </span>
                  ) : null}
                </div>
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
          <li key={report.id}>
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
