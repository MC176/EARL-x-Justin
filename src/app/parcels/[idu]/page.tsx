import { notFound } from "next/navigation";
import Link from "next/link";
import { CommentForm } from "@/components/CommentForm";
import { InterventionForm } from "@/components/InterventionForm";
import { ParcelCommentsList } from "@/components/ParcelCommentsList";
import { ParcelInterventionsList } from "@/components/ParcelInterventionsList";
import { ParcelReportsList } from "@/components/ParcelReportsList";
import { ParcelTimeline } from "@/components/ParcelTimeline";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSurface } from "@/lib/format";
import { getParcelDetailData } from "@/lib/operations";
import { getAgronomicStatusMeta } from "@/lib/status";

interface ParcelDetailPageProps {
  params: Promise<{ idu: string }>;
}

export default async function ParcelDetailPage({
  params,
}: ParcelDetailPageProps) {
  const { idu } = await params;
  const detail = await getParcelDetailData(decodeURIComponent(idu));

  if (!detail) {
    notFound();
  }

  const { parcel, summary, interventions, comments, reports, activity, attachments, tasks, incidents } =
    detail;
  const agronomicStatus = getAgronomicStatusMeta(parcel.status);
  const activeClosableComments = comments.filter(
    (comment) =>
      comment.is_active &&
      (
        comment.action_state === "todo" ||
        comment.action_state === "in_progress" ||
        comment.action_state === "problem"
      ),
  );

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {parcel.name || parcel.idu}
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Fiche terrain complète de la parcelle.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="#ajouter-intervention"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-slate-900 px-4 text-base font-semibold text-white shadow-xs hover:bg-slate-800"
          >
            Ajouter une intervention
          </Link>
          <Link
            href="#ajouter-commentaire"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            Ajouter un commentaire
          </Link>
          <Link
            href={`/reporting?parcel_id=${encodeURIComponent(parcel.parcel_id)}`}
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
          >
            Ajouter un reporting
          </Link>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              tone={summary.tone}
              label={summary.label}
              title={summary.description}
            />
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium ${agronomicStatus.badgeClassName}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${agronomicStatus.dotClassName}`}
              />
              {agronomicStatus.label}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Informations parcelle
            </h2>
            <p className="mt-1 text-base text-slate-500">{summary.description}</p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Nom
              </dt>
              <dd className="mt-1 text-base text-slate-900">{parcel.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                IDU
              </dt>
              <dd className="mt-1 text-base text-slate-900">{parcel.idu}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Commune / section / numéro
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {parcel.commune} · {parcel.section} {parcel.numero}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Cépage
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {parcel.grape_variety || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Surface
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {formatSurface(parcel.area_m2)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Exploitant
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {parcel.owner_name} ({parcel.owner_code})
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Notes
              </dt>
              <dd className="mt-1 text-base text-slate-900">
                {parcel.notes || "Aucune note renseignée."}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Synthèse opérationnelle
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Vision rapide des signaux utiles pour le terrain.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Interventions
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {interventions.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Commentaires
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {comments.length}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Problèmes actifs
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {summary.active_problems_total}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Actions en cours
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {summary.active_in_progress_total}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Actions terminées
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {summary.completed_items_recently}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Incidents ouverts V2
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {summary.open_incidents}
              </div>
            </div>
          </div>

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-base text-slate-600">
            {tasks.length > 0 || incidents.length > 0
              ? "Les structures incidents et tâches sont prêtes pour la V2 premium et déjà prises en compte dans le statut visuel."
              : "Les structures incidents et tâches sont prêtes. Dès qu'elles seront alimentées, elles remonteront automatiquement ici et dans le dashboard."}
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div id="ajouter-intervention">
          <InterventionForm
            parcelId={parcel.parcel_id}
            parcelLabel={parcel.name || parcel.idu}
          />
        </div>
        <div id="ajouter-commentaire">
          <CommentForm
            parcelId={parcel.parcel_id}
            parcelLabel={parcel.name || parcel.idu}
            activeClosableComments={activeClosableComments}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Interventions
              </h2>
              <p className="mt-1 text-base text-slate-500">
                Historique chronologique des actions menées.
              </p>
            </div>
          </div>

          <ParcelInterventionsList interventions={interventions} />
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Commentaires
              </h2>
              <p className="mt-1 text-base text-slate-500">
                Notes terrain, actions en cours, clôtures et problèmes signalés.
              </p>
            </div>
          </div>

          <ParcelCommentsList comments={comments} />
        </section>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reportings</h2>
          <p className="mt-1 text-base text-slate-500">
            Comptes-rendus terrain structurés associés à cette parcelle.
          </p>
        </div>

        <ParcelReportsList reports={reports} />
      </section>

      <ParcelTimeline items={activity} />

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Photos et pièces jointes
          </h2>
          <p className="mt-1 text-base text-slate-500">
            Structure prête pour Supabase Storage, PDF, photos et consignes.
          </p>
        </div>

        {attachments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-base text-slate-500">
            Aucun fichier attaché pour l&apos;instant. La table `attachments` est
            prête pour brancher le stockage.
          </div>
        ) : (
          <ul className="space-y-3">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700"
              >
                {attachment.original_filename}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
