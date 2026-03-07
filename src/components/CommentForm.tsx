"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { buildAuthorPayload } from "@/lib/author";
import { getCommentStateMeta } from "@/lib/status";
import { supabase } from "@/lib/supabase";
import { getSupabaseUiErrorMessage } from "@/lib/supabaseErrors";
import type { ParcelComment } from "@/types/operations";
import {
  COMMENT_ACTION_STATE_OPTIONS,
  type CommentActionState,
} from "@/types/operations";

interface CommentFormProps {
  parcelId: string;
  parcelLabel: string;
  variant?: "full" | "compact";
  allowedStates?: CommentActionState[];
  defaultState?: CommentActionState;
  activeClosableComments?: ParcelComment[];
  title?: string;
  description?: string;
  submitLabel?: string;
  onSaved?: () => void | Promise<void>;
}

export function CommentForm({
  parcelId,
  parcelLabel,
  variant = "full",
  allowedStates = ["note", "in_progress", "done", "problem"],
  defaultState = "note",
  activeClosableComments = [],
  title,
  description,
  submitLabel,
  onSaved,
}: CommentFormProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    actionState: defaultState,
    closesCommentId: "",
    content: "",
  });

  const isCompact = variant === "compact";
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

    if (
      form.actionState === "done" &&
      activeClosableComments.length > 0 &&
      !form.closesCommentId
    ) {
      setError(
        "Sélectionnez l'action ou le problème à clôturer avant de marquer terminé.",
      );
      return;
    }

    const author = buildAuthorPayload(user, profile);

    const { error: insertError } = await supabase.from("parcel_comments").insert({
      parcel_id: parcelId,
      content: form.content,
      author_id: author.author_id,
      author_name: author.author_name,
      author_code: author.author_code,
      action_state: form.actionState,
      closes_comment_id:
        form.actionState === "done" && form.closesCommentId
          ? form.closesCommentId
          : null,
    });

    if (insertError) {
      setError(
        getSupabaseUiErrorMessage(
          insertError,
          "Impossible d'enregistrer le commentaire pour le moment.",
        ),
      );
      return;
    }

    setSuccess(
      form.actionState === "done"
        ? "Clôture enregistrée."
        : "Commentaire enregistré.",
    );
    setForm({
      actionState: defaultState,
      closesCommentId: "",
      content: "",
    });
    await onSaved?.();
    startTransition(() => router.refresh());
  }

  return (
    <form
      id="ajouter-commentaire"
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-slate-900">
          {title ?? (isCompact ? "Action rapide carte" : "Ajouter un commentaire")}
        </h2>
        <p className="text-base text-slate-500">
          {description ??
            (isCompact
              ? `Saisie rapide sur ${parcelLabel} avec impact immédiat sur le statut.`
              : `Note terrain rapide liée à ${parcelLabel}, visible dans le journal d'activité.`)}
        </p>
      </div>

      <div className={`grid gap-3 ${isCompact ? "" : "sm:grid-cols-2"}`}>
        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">État</span>
          <select
            value={form.actionState}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                actionState: event.target.value as CommentActionState,
                closesCommentId:
                  event.target.value === "done" ? current.closesCommentId : "",
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            {selectableStates.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-sm text-slate-500">
            {selectedStateMeta.description}
          </span>
        </label>

        <div className={`rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700 ${isCompact ? "" : "sm:col-span-2"}`}>
          Auteur connecté :{" "}
          <span className="font-medium text-slate-900">
            {loading ? "Chargement..." : profile?.display_name ?? user?.email ?? "Utilisateur"}
          </span>
        </div>
      </div>

      {form.actionState === "done" && activeClosableComments.length > 0 ? (
        <label className="block text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Élément à clôturer</span>
          <select
            value={form.closesCommentId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                closesCommentId: event.target.value,
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="">Sélectionner un élément actif</option>
            {activeClosableComments.map((comment) => {
              const meta = getCommentStateMeta(comment.action_state);

              return (
                <option key={comment.id} value={comment.id}>
                  {meta.label} - {comment.content.slice(0, 70)}
                </option>
              );
            })}
          </select>
        </label>
      ) : null}

      {form.actionState === "done" && activeClosableComments.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-700">
          Aucun problème ni élément en cours actif à clôturer sur cette parcelle.
        </div>
      ) : null}

      <label className="block text-sm text-slate-700">
        <span className="mb-2 block text-base font-medium text-slate-900">Commentaire</span>
        <textarea
          value={form.content}
          onChange={(event) =>
            setForm((current) => ({ ...current, content: event.target.value }))
          }
          rows={isCompact ? 3 : 4}
          placeholder={
            isCompact
              ? "Action à suivre, point terminé ou problème constaté..."
              : "Remarque terrain, observation, point de vigilance..."
          }
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
          required
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
          {isCompact
            ? "Chaque saisie met à jour le statut consolidé de la parcelle."
            : "Photos et pièces jointes prévues via la table `attachments`."}
        </p>
        <button
          type="submit"
          disabled={isPending || loading || !user}
          className={`inline-flex min-h-14 items-center justify-center rounded-full px-6 text-base font-semibold shadow-xs disabled:cursor-not-allowed disabled:opacity-60 ${
            isCompact
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
          }`}
        >
          {isPending
            ? "Enregistrement..."
            : submitLabel ??
              (isCompact ? "Enregistrer depuis la carte" : "Enregistrer le commentaire")}
        </button>
      </div>
    </form>
  );
}
