import Link from "next/link";
import { DashboardAlerts } from "@/components/DashboardAlerts";
import { DashboardRecentActivity } from "@/components/DashboardRecentActivity";
import { DashboardStats } from "@/components/DashboardStats";
import { OwnerFilterSelect } from "@/components/OwnerFilterSelect";
import { ParcelCommentsList } from "@/components/ParcelCommentsList";
import { ParcelInterventionsList } from "@/components/ParcelInterventionsList";
import { ParcelReportsList } from "@/components/ParcelReportsList";
import { getOwnerOptions } from "@/lib/api";
import { getDashboardData } from "@/lib/operations";

interface DashboardPageProps {
  searchParams: Promise<{ owner?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { owner } = await searchParams;
  const ownerFilter = owner ?? "";
  const owners = await getOwnerOptions();
  const dashboard = await getDashboardData(ownerFilter ? { owner: ownerFilter } : {});
  const parcelsById = dashboard.parcels.reduce<Record<string, (typeof dashboard.parcels)[number]>>(
    (accumulator, parcel) => {
      accumulator[parcel.parcel_id] = parcel;
      return accumulator;
    },
    {},
  );

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Tableau de bord
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Vue terrain rapide pour suivre les parcelles, alertes et actions du jour.
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

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/map"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-slate-900 px-4 text-base font-semibold text-white shadow-xs hover:bg-slate-800"
          >
            Ouvrir la carte
          </Link>
          <Link
            href="/journal"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            Voir le journal
          </Link>
        </div>
      </section>

      <DashboardStats
        cards={[
          {
            label: "Total parcelles",
            value: dashboard.kpis.totalParcels,
            helper: "Parcelles suivies pour l'exploitant",
          },
          {
            label: "Problèmes actifs",
            value: dashboard.kpis.parcelsWithActiveProblems,
            helper: "Parcelles avec problème non résolu",
          },
          {
            label: "Actions en cours",
            value: dashboard.kpis.parcelsWithInProgressActions,
            helper: "Parcelles à suivre sur le terrain",
          },
          {
            label: "Actions terminées",
            value: dashboard.kpis.actionsCompletedRecently,
            helper: "Clôtures enregistrées sur 7 jours",
          },
          {
            label: "Interventions du jour",
            value: dashboard.kpis.interventionsToday,
            helper: "Saisies enregistrées aujourd'hui",
          },
          {
            label: "Reportings récents",
            value: dashboard.kpis.recentReports,
            helper: "Comptes-rendus saisis sur 7 jours",
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <DashboardRecentActivity items={dashboard.recentActivity} />
        <DashboardAlerts alerts={dashboard.alerts} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Problèmes</h2>
            <p className="mt-1 text-base text-slate-500">
              Toutes les parcelles avec problème actif.
            </p>
          </div>

          <ParcelCommentsList
            comments={dashboard.activeProblemComments}
            parcelsById={parcelsById}
            emptyMessage="Aucun problème actif sur les parcelles."
          />
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">En cours</h2>
            <p className="mt-1 text-base text-slate-500">
              Parcelles ayant une action non clôturée.
            </p>
          </div>

          <ParcelCommentsList
            comments={dashboard.inProgressComments}
            parcelsById={parcelsById}
            emptyMessage="Aucune action en cours."
          />
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Derniers reportings
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Comptes-rendus terrain structurés les plus récents.
            </p>
          </div>

          <ParcelReportsList
            reports={dashboard.latestReports}
            parcelsById={parcelsById}
            emptyMessage="Aucun reporting récent."
          />
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Historique récent
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Qui a commenté, sur quelle parcelle, avec quel état et quand.
            </p>
          </div>

          <ParcelCommentsList
            comments={dashboard.latestComments}
            parcelsById={parcelsById}
            emptyMessage="Aucun commentaire récent."
          />
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Synthèse terrain
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Dernières interventions et clôtures utiles au pilotage.
            </p>
          </div>

          <ParcelInterventionsList
            interventions={dashboard.latestInterventions}
            parcelsById={parcelsById}
            emptyMessage="Aucune intervention récente."
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-600">
            {dashboard.kpis.actionsCompletedRecently} action
            {dashboard.kpis.actionsCompletedRecently > 1 ? "s" : ""} terminée
            {dashboard.kpis.actionsCompletedRecently > 1 ? "s" : ""} récemment.
          </div>
        </section>
      </div>
    </div>
  );
}
