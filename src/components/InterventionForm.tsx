"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { buildAuthorPayload } from "@/lib/author";
import { supabase } from "@/lib/supabase";
import { getSupabaseUiErrorMessage } from "@/lib/supabaseErrors";
import { INTERVENTION_TYPE_OPTIONS } from "@/types/operations";

interface InterventionFormProps {
  parcelId: string;
  parcelLabel: string;
}

type InterventionFormState = {
  interventionType: (typeof INTERVENTION_TYPE_OPTIONS)[number];
  date: string;
  startTime: string;
  endTime: string;
  comment: string;
};

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
  const { user, profile, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<InterventionFormState>({
    interventionType: INTERVENTION_TYPE_OPTIONS[0],
    date: DEFAULT_DATE,
    startTime: DEFAULT_TIME,
    endTime: "",
    comment: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("Session utilisateur introuvable. Reconnectez-vous.");
      return;
    }

    const author = buildAuthorPayload(user, profile);

    const { error: insertError } = await supabase.from("parcel_interventions").insert({
      parcel_id: parcelId,
      author_id: author.author_id,
      intervention_type: form.interventionType,
      date: form.date,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      comment: form.comment || null,
      author_name: author.author_name,
      author_code: author.author_code,
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
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">
          Ajouter une intervention
        </h2>
        <p className="text-base text-slate-500">
          Saisie rapide pour {parcelLabel}. Les photos pourront être branchées sur
          Supabase Storage sans changer cette structure.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Type d&apos;intervention</span>
          <select
            value={form.interventionType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                interventionType: event.target.value as InterventionFormState["interventionType"],
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            {INTERVENTION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Date</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm((current) => ({ ...current, date: event.target.value }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
            required
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Heure début</span>
          <input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                startTime: event.target.value,
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Heure fin</span>
          <input
            type="time"
            value={form.endTime}
            onChange={(event) =>
              setForm((current) => ({ ...current, endTime: event.target.value }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Auteur connecté</span>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900">
            {loading ? "Chargement..." : profile?.display_name ?? user?.email ?? "Utilisateur"}
          </div>
        </label>
      </div>

      <label className="block text-sm text-slate-700">
        <span className="mb-2 block text-base font-medium text-slate-900">Commentaire</span>
        <textarea
          value={form.comment}
          onChange={(event) =>
            setForm((current) => ({ ...current, comment: event.target.value }))
          }
          rows={3}
          placeholder="Observations terrain, détails, remarques..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Champ photo prêt côté base. Upload fichiers à brancher dans l&apos;étape
          suivante.
        </p>
        <button
          type="submit"
          disabled={isPending || loading || !user}
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-slate-900 px-6 text-base font-semibold text-white shadow-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Enregistrement..." : "Enregistrer l'intervention"}
        </button>
      </div>
    </form>
  );
}
