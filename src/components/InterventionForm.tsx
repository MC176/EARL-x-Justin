"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSupabaseUiErrorMessage } from "@/lib/supabaseErrors";
import { INTERVENTION_TYPE_OPTIONS } from "@/types/operations";

interface InterventionFormProps {
  parcelId: string;
  parcelLabel: string;
}

const now = new Date();
const DEFAULT_DATE = now.toISOString().slice(0, 10);
const DEFAULT_TIME = `${String(now.getHours()).padStart(2, "0")}:${String(
  now.getMinutes(),
).padStart(2, "0")}`;

export function InterventionForm({
  parcelId,
  parcelLabel,
}: InterventionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    interventionType: INTERVENTION_TYPE_OPTIONS[0],
    date: DEFAULT_DATE,
    startTime: DEFAULT_TIME,
    endTime: "",
    comment: "",
    authorName: "",
    authorCode: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const { error: insertError } = await supabase.from("parcel_interventions").insert({
      parcel_id: parcelId,
      intervention_type: form.interventionType,
      date: form.date,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      comment: form.comment || null,
      author_name: form.authorName,
      author_code: form.authorCode || null,
      status: "done",
    });

    if (insertError) {
      setError(
        getSupabaseUiErrorMessage(
          insertError,
          "Impossible d'enregistrer l'intervention pour le moment.",
        ),
      );
      return;
    }

    setSuccess("Intervention enregistrée.");
    setForm((current) => ({
      ...current,
      endTime: "",
      comment: "",
    }));
    startTransition(() => router.refresh());
  }

  return (
    <form
      id="ajouter-intervention"
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900">
          Ajouter une intervention
        </h2>
        <p className="text-sm text-slate-500">
          Saisie rapide pour {parcelLabel}. Les photos pourront être branchées sur
          Supabase Storage sans changer cette structure.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Type d&apos;intervention</span>
          <select
            value={form.interventionType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                interventionType: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {INTERVENTION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm((current) => ({ ...current, date: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Heure début</span>
          <input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startTime: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Heure fin</span>
          <input
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((current) => ({ ...current, endTime: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Auteur</span>
          <input
            type="text"
            value={form.authorName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                authorName: event.target.value,
              }))
            }
            placeholder="Nom de la personne"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">Code auteur</span>
          <input
            type="text"
            value={form.authorCode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                authorCode: event.target.value,
              }))
            }
            placeholder="Optionnel"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>
      </div>

      <label className="block text-sm text-slate-700">
        <span className="mb-1 block">Commentaire</span>
        <textarea
          value={form.comment}
          onChange={(event) =>
            setForm((current) => ({ ...current, comment: event.target.value }))
          }
          rows={3}
          placeholder="Observations terrain, détails, remarques..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Champ photo prêt côté base. Upload fichiers à brancher dans l&apos;étape
          suivante.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Enregistrement..." : "Enregistrer l'intervention"}
        </button>
      </div>
    </form>
  );
}
