"use client";

import Link from "next/link";
import { CommentForm } from "@/components/CommentForm";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSurface } from "@/lib/format";
import { getAgronomicStatusMeta } from "@/lib/status";
import type { Parcel } from "@/types/parcel";
import type { ParcelComment, ParcelOperationalSummary } from "@/types/operations";

interface MapActionPanelProps {
  parcel: Parcel;
  summary: ParcelOperationalSummary;
  comments: ParcelComment[];
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}

export function MapActionPanel({
  parcel,
  summary,
  comments,
  onClose,
  onSaved,
}: MapActionPanelProps) {
  const agronomicStatus = getAgronomicStatusMeta(parcel.status);
  const activeClosableComments = comments.filter(
    (comment) =>
      comment.is_active &&
      (comment.action_state === "in_progress" || comment.action_state === "problem"),
  );

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-auto sm:w-[380px]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-900">
            Ajouter une action
          </h3>
          <p className="mt-1 text-base text-slate-500">
            {parcel.name || parcel.idu} · {parcel.commune}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          ×
        </button>
      </div>

      <div className="mb-4 space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            tone={summary.tone}
            label={summary.label}
            title={summary.description}
          />
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${agronomicStatus.badgeClassName}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${agronomicStatus.dotClassName}`}
            />
            {agronomicStatus.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href={`/ajouter?action=intervention&parcel_id=${encodeURIComponent(parcel.parcel_id)}`}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-3 text-center text-sm font-semibold text-slate-900"
          >
            Intervention
          </Link>
          <Link
            href={`/ajouter?action=commentaire&parcel_id=${encodeURIComponent(parcel.parcel_id)}`}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-3 text-center text-sm font-semibold text-slate-900"
          >
            Commentaire
          </Link>
          <Link
            href={`/reporting?parcel_id=${encodeURIComponent(parcel.parcel_id)}`}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-white px-3 text-center text-sm font-semibold text-slate-900"
          >
            Reporting
          </Link>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-sm text-slate-600">
          <div>
            <dt className="text-slate-400">Cépage</dt>
            <dd className="mt-1">{parcel.grape_variety || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Surface</dt>
            <dd className="mt-1">{formatSurface(parcel.area_m2)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Problèmes actifs</dt>
            <dd className="mt-1">{summary.active_problems_total}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Actions en cours</dt>
            <dd className="mt-1">{summary.active_in_progress_total}</dd>
          </div>
        </dl>

        <p className="text-sm text-slate-600">{summary.description}</p>
      </div>

      <CommentForm
        parcelId={parcel.parcel_id}
        parcelLabel={parcel.name || parcel.idu}
        variant="compact"
        allowedStates={["in_progress", "done", "problem"]}
        defaultState="in_progress"
        activeClosableComments={activeClosableComments}
        title="Ajouter une action"
        description="Depuis la carte: en cours, terminé ou signaler un problème."
        submitLabel="Enregistrer"
        onSaved={onSaved}
      />
    </div>
  );
}
