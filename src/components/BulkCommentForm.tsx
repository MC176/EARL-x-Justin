"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { buildAuthorPayload } from "@/lib/author";
import { getCommentStateMeta } from "@/lib/status";
import { supabase } from "@/lib/supabase";
import { getSupabaseUiErrorMessage } from "@/lib/supabaseErrors";
import type { Parcel } from "@/types/parcel";
import {
  COMMENT_ACTION_STATE_OPTIONS,
  type CommentActionState,
} from "@/types/operations";

interface BulkCommentFormProps {
  parcels: Parcel[];
  defaultState?: CommentActionState;
  allowedStates?: CommentActionState[];
  onClose: () => void;
  onSubmitted?: () => void | Promise<void>;
}

export function BulkCommentForm({
  parcels,
  defaultState = "in_progress",
  allowedStates = ["in_progress", "done", "problem"],
  onClose,
  onSubmitted,
}: BulkCommentFormProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    actionState: defaultState,
    content: "",
  });

  const selectableStates = COMMENT_ACTION_STATE_OPTIONS.filter((option) =>
    allowedStates.includes(option.value),
  );
  const selectedStateMeta = getCommentStateMeta(form.actionState);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("Session utilisateur introuvable. Reconnectez-vous.");
      return;
    }

    if (parcels.length === 0) {
      setError("Aucune parcelle sélectionnée.");
      return;
    }

    const author = buildAuthorPayload(user, profile);
    const rows = parcels.map((parcel) => ({
      parcel_id: parcel.parcel_id,
      content: form.content,
      author_id: author.author_id,
      author_name: author.author_name,
      author_code: author.author_code,
      action_state: form.actionState,
      closes_comment_id: null,
    }));

    const { error: insertError } = await supabase
      .from("parcel_comments")
      .insert(rows);

    if (insertError) {
      setError(
        getSupabaseUiErrorMessage(
          insertError,
          "Impossible d'enregistrer le commentaire groupé pour le moment.",
        ),
      );
      return;
    }

    setSuccess(
      form.actionState === "done"
        ? "Clôture groupée enregistrée."
        : "Commentaire groupé enregistré.",
    );

    setForm({
      actionState: defaultState,
      content: "",
    });

    await onSubmitted?.();
    startTransition(() => router.refresh());
    onClose();
  }

  const title =
    parcels.length === 1
      ? `Commentaire pour ${parcels[0].name || parcels[0].idu}`
      : `Commentaire groupé sur ${parcels.length} parcelles`;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/30 px-3 pb-5 pt-10 sm:items-center sm:px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Un même commentaire et un même état seront appliqués à toutes les
              parcelles sélectionnées.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Fermer le formulaire groupé"
          >
            ×
          </button>
        </div>

        <div className="mb-3 max-h-24 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <p className="mb-1 font-semibold text-slate-700">
            Parcelles concernées :
          </p>
          <ul className="flex flex-wrap gap-1">
            {parcels.map((parcel) => (
              <li
                key={parcel.parcel_id}
                className="rounded-full bg-white px-2 py-0.5"
              >
                {parcel.name || parcel.idu}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1.1fr_1.4fr]">
            <label className="text-xs text-slate-700">
              <span className="mb-1 block text-sm font-medium text-slate-900">
                État
              </span>
              <select
                value={form.actionState}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    actionState: event.target.value as CommentActionState,
                  }))
                }
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              >
                {selectableStates.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-slate-500">
                {selectedStateMeta.description}
              </span>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              Auteur connecté :{" "}
              <span className="font-medium text-slate-900">
                {loading
                  ? "Chargement..."
                  : profile?.display_name ?? user?.email ?? "Utilisateur"}
              </span>
            </div>
          </div>

          <label className="block text-xs text-slate-700">
            <span className="mb-1 block text-sm font-medium text-slate-900">
              Commentaire
            </span>
            <textarea
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({ ...current, content: event.target.value }))
              }
              rows={4}
              placeholder="Action en cours, point terminé ou problème sur plusieurs parcelles..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || loading || !user}
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Enregistrement..." : "Appliquer à toutes les parcelles"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

