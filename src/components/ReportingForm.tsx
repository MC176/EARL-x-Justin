"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { buildAuthorPayload } from "@/lib/author";
import { getReportStatusMeta } from "@/lib/status";
import { supabase } from "@/lib/supabase";
import { getSupabaseUiErrorMessage } from "@/lib/supabaseErrors";
import type { Parcel } from "@/types/parcel";
import type { ParcelReport, ReportStatus } from "@/types/operations";
import { REPORT_STATUS_OPTIONS, REPORT_TYPE_OPTIONS } from "@/types/operations";

interface ReportingFormProps {
  parcels: Parcel[];
  initialParcelId?: string;
  reports: ParcelReport[];
}

type ReportingFormState = {
  parcelId: string;
  reportType: (typeof REPORT_TYPE_OPTIONS)[number];
  status: ReportStatus;
  date: string;
  startTime: string;
  endTime: string;
  closesReportId: string;
  summary: string;
  details: string;
};

const now = new Date();
const DEFAULT_DATE = now.toISOString().slice(0, 10);
const DEFAULT_TIME = `${String(now.getHours()).padStart(2, "0")}:${String(
  now.getMinutes(),
).padStart(2, "0")}`;

export function ReportingForm({
  parcels,
  initialParcelId,
  reports,
}: ReportingFormProps) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ReportingFormState>({
    parcelId: initialParcelId ?? parcels[0]?.parcel_id ?? "",
    reportType: REPORT_TYPE_OPTIONS[0],
    status: "in_progress" as ReportStatus,
    date: DEFAULT_DATE,
    startTime: DEFAULT_TIME,
    endTime: "",
    closesReportId: "",
    summary: "",
    details: "",
  });

  const selectedParcel = useMemo(
    () => parcels.find((parcel) => parcel.parcel_id === form.parcelId) ?? null,
    [parcels, form.parcelId],
  );

  const activeClosableReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.parcel_id === form.parcelId &&
          report.is_active &&
          (report.status === "in_progress" || report.status === "problem"),
      ),
    [reports, form.parcelId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("Session utilisateur introuvable. Reconnectez-vous.");
      return;
    }

    if (!form.parcelId) {
      setError("Sélectionnez une parcelle avant d'enregistrer le reporting.");
      return;
    }

    if (
      form.status === "done" &&
      activeClosableReports.length > 0 &&
      !form.closesReportId
    ) {
      setError("Choisissez le reporting actif à clôturer.");
      return;
    }

    const author = buildAuthorPayload(user, profile);

    const { error: insertError } = await supabase.from("parcel_reports").insert({
      parcel_id: form.parcelId,
      author_id: author.author_id,
      author_name: author.author_name,
      author_code: author.author_code,
      report_type: form.reportType,
      status: form.status,
      date: form.date,
      start_time: form.startTime || null,
      end_time: form.endTime || null,
      summary: form.summary,
      details: form.details || null,
      closes_report_id:
        form.status === "done" && form.closesReportId ? form.closesReportId : null,
    });

    if (insertError) {
      setError(
        getSupabaseUiErrorMessage(
          insertError,
          "Impossible d'enregistrer le reporting pour le moment.",
        ),
      );
      return;
    }

    setSuccess("Reporting enregistré.");
    setForm((current) => ({
      ...current,
      status: "in_progress",
      startTime: DEFAULT_TIME,
      endTime: "",
      closesReportId: "",
      summary: "",
      details: "",
    }));
    startTransition(() => router.refresh());
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Renseigner un reporting
        </h2>
        <p className="mt-1 text-base text-slate-500">
          Compte-rendu structuré d&apos;une action terrain, plus détaillé qu&apos;un
          commentaire rapide.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-2 block text-base font-medium text-slate-900">Parcelle</span>
          <select
            value={form.parcelId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                parcelId: event.target.value,
                closesReportId: "",
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
            required
          >
            {parcels.map((parcel) => (
              <option key={parcel.parcel_id} value={parcel.parcel_id}>
                {parcel.name || parcel.idu} - {parcel.idu}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Type d&apos;action</span>
          <select
            value={form.reportType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                reportType: event.target.value as ReportingFormState["reportType"],
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            {REPORT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">État</span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as ReportStatus,
                closesReportId:
                  event.target.value === "done" ? current.closesReportId : "",
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-sm text-slate-500">
            {getReportStatusMeta(form.status).description}
          </span>
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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900">
          Auteur connecté :{" "}
          <span className="font-medium">
            {loading ? "Chargement..." : profile?.display_name ?? user?.email ?? "Utilisateur"}
          </span>
        </div>

        <label className="text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Heure début</span>
          <input
            type="time"
            value={form.startTime}
            onChange={(event) =>
              setForm((current) => ({ ...current, startTime: event.target.value }))
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

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-600 md:col-span-2">
          L&apos;auteur est automatiquement enregistré à partir de l&apos;utilisateur connecté.
        </div>
      </div>

      {form.status === "done" && activeClosableReports.length > 0 ? (
        <label className="block text-sm text-slate-700">
          <span className="mb-2 block text-base font-medium text-slate-900">Reporting à clôturer</span>
          <select
            value={form.closesReportId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                closesReportId: event.target.value,
              }))
            }
            className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          >
            <option value="">Sélectionner un reporting actif</option>
            {activeClosableReports.map((report) => (
              <option key={report.id} value={report.id}>
                {report.report_type} - {report.summary.slice(0, 80)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block text-sm text-slate-700">
        <span className="mb-2 block text-base font-medium text-slate-900">Résumé</span>
        <input
          type="text"
          value={form.summary}
          onChange={(event) =>
            setForm((current) => ({ ...current, summary: event.target.value }))
          }
          placeholder="Ex: Désherbage terminé sur la parcelle"
          className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          required
        />
      </label>

      <label className="block text-sm text-slate-700">
        <span className="mb-2 block text-base font-medium text-slate-900">Détail du compte-rendu</span>
        <textarea
          value={form.details}
          onChange={(event) =>
            setForm((current) => ({ ...current, details: event.target.value }))
          }
          rows={5}
          placeholder="Ce qui a été fait, observations, contraintes rencontrées, suite à prévoir..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      {selectedParcel ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-600">
          Reporting en cours pour <span className="font-medium text-slate-900">{selectedParcel.name || selectedParcel.idu}</span>.
        </div>
      ) : null}

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
          Les pièces jointes pourront être branchées ensuite via `attachments`.
        </p>
        <button
          type="submit"
          disabled={isPending || loading || !user}
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-slate-900 px-6 text-base font-semibold text-white shadow-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Enregistrement..." : "Enregistrer le reporting"}
        </button>
      </div>
    </form>
  );
}
