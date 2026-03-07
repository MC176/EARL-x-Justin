"use client";

import { useMemo, useState } from "react";
import { CommentForm } from "@/components/CommentForm";
import { InterventionForm } from "@/components/InterventionForm";
import { ReportingForm } from "@/components/ReportingForm";
import type { Parcel } from "@/types/parcel";
import type { ParcelComment, ParcelReport } from "@/types/operations";

type AddActionType = "intervention" | "commentaire" | "reporting" | "probleme";

interface AddPageClientProps {
  parcels: Parcel[];
  comments: ParcelComment[];
  reports: ParcelReport[];
  initialParcelId?: string;
  initialAction?: AddActionType;
}

const ACTIONS: Array<{ value: AddActionType; label: string }> = [
  { value: "intervention", label: "Intervention" },
  { value: "commentaire", label: "Commentaire" },
  { value: "reporting", label: "Reporting" },
  { value: "probleme", label: "Problème" },
];

export function AddPageClient({
  parcels,
  comments,
  reports,
  initialParcelId,
  initialAction = "intervention",
}: AddPageClientProps) {
  const [selectedParcelId, setSelectedParcelId] = useState(
    initialParcelId ?? parcels[0]?.parcel_id ?? "",
  );
  const [selectedAction, setSelectedAction] =
    useState<AddActionType>(initialAction);

  const selectedParcel = useMemo(
    () => parcels.find((parcel) => parcel.parcel_id === selectedParcelId) ?? null,
    [parcels, selectedParcelId],
  );

  const activeClosableComments = useMemo(
    () =>
      comments.filter(
        (comment) =>
          comment.parcel_id === selectedParcelId &&
          comment.is_active &&
          (
            comment.action_state === "todo" ||
            comment.action_state === "in_progress" ||
            comment.action_state === "problem"
          ),
      ),
    [comments, selectedParcelId],
  );

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ajouter</h1>
          <p className="mt-1 text-base text-slate-500">
            Accès rapide aux actions terrain.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((action) => (
            <button
              key={action.value}
              type="button"
              onClick={() => setSelectedAction(action.value)}
              className={`min-h-14 rounded-2xl px-4 text-base font-semibold ${
                selectedAction === action.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>

        <label className="block text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">
            Parcelle
          </span>
          <select
            value={selectedParcelId}
            onChange={(event) => setSelectedParcelId(event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none"
          >
            {parcels.map((parcel) => (
              <option key={parcel.parcel_id} value={parcel.parcel_id}>
                {parcel.name || parcel.idu} - {parcel.idu}
              </option>
            ))}
          </select>
        </label>
      </section>

      {selectedParcel ? (
        <>
          {selectedAction === "intervention" ? (
            <InterventionForm
              parcelId={selectedParcel.parcel_id}
              parcelLabel={selectedParcel.name || selectedParcel.idu}
            />
          ) : null}

          {selectedAction === "commentaire" ? (
            <CommentForm
              parcelId={selectedParcel.parcel_id}
              parcelLabel={selectedParcel.name || selectedParcel.idu}
              defaultState="note"
              allowedStates={["note", "todo", "in_progress", "done", "problem"]}
              activeClosableComments={activeClosableComments}
            />
          ) : null}

          {selectedAction === "probleme" ? (
            <CommentForm
              parcelId={selectedParcel.parcel_id}
              parcelLabel={selectedParcel.name || selectedParcel.idu}
              defaultState="problem"
              allowedStates={["problem", "done"]}
              activeClosableComments={activeClosableComments}
              title="Signaler un problème"
              description="Signalement rapide d'un problème terrain."
              submitLabel="Signaler"
            />
          ) : null}

          {selectedAction === "reporting" ? (
            <ReportingForm
              parcels={parcels}
              reports={reports}
              initialParcelId={selectedParcel.parcel_id}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
