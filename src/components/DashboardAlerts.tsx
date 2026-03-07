import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { DashboardAlert } from "@/types/operations";

interface DashboardAlertsProps {
  alerts: DashboardAlert[];
}

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Alertes et éléments à faire
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Priorités terrain: incidents ouverts, retards et parcelles bloquées.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-700">
          Aucune alerte active. Le suivi opérationnel est à jour.
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const content = (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={alert.tone} />
                  <span className="text-xs text-slate-500">{alert.parcel_label}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {alert.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
              </div>
            );

            return (
              <li key={alert.id}>
                {alert.href ? (
                  <Link href={alert.href} className="block">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
