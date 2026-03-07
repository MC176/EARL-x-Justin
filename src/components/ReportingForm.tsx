"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    parcelId: initialParcelId ?? parcels[0]?.parcel_id ?? "",
    reportType: REPORT_TYPE_OPTIONS[0],
    status: "in_progress" as ReportStatus,
    date: DEFAULT_DATE,
    startTime: DEFAULT_TIME,
    endTime: "",
    authorName: "",
    authorCode: "",
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

    const { error: insertError } = await supabase.from("parcel_reports").insert({
      parcel_id: form.parcelId,
      author_name: form.authorName,
      author_code: form.authorCode || null,
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
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Renseigner un reporting
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Compte-rendu structuré d&apos;une action terrain, plus détaillé qu&apos;un
          commentaire rapide.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block">Parcelle</span>
          <select
            value={form.parcelId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                parcelId: event.target.value,
                closesReportId: "",
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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
          <span className="mb-1 block">Type d&apos;action</span>
          <select
            value={form.reportType}
            onChange={(event) =>
              setForm((current) => ({ ...current, reportType: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {REPORT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          <span className="mb-1 block">État</span>
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
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            {getReportStatusMeta(form.status).description}
          </span>
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
          <span className="mb-1 block">Auteur</span>
          <input
            type="text"
            value={form.authorName}
            onChange={(event) =>
              setForm((current) => ({ ...current, authorName: event.target.value }))
            }
            placeholder="Nom de la personne"
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
              setForm((current) => ({ ...current, startTime: event.target.value }))
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

        <label className="text-sm text-slate-700 md:col-span-2">
          <span className="mb-1 block">Code auteur</span>
          <input
            type="text"
            value={form.authorCode}
            onChange={(event) =>
              setForm((current) => ({ ...current, authorCode: event.target.value }))
            }
            placeholder="Optionnel"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>
      </div>

      {form.status === "done" && activeClosableReports.length > 0 ? (
        <label className="block text-sm text-slate-700">
          <span className="mb-1 block">Reporting à clôturer</span>
          <select
            value={form.closesReportId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                closesReportId: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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
        <span className="mb-1 block">Résumé</span>
        <input
          type="text"
          value={form.summary}
          onChange={(event) =>
            setForm((current) => ({ ...current, summary: event.target.value }))
          }
          placeholder="Ex: Désherbage terminé sur la parcelle"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          required
        />
      </label>

      <label className="block text-sm text-slate-700">
        <span className="mb-1 block">Détail du compte-rendu</span>
        <textarea
          value={form.details}
          onChange={(event) =>
            setForm((current) => ({ ...current, details: event.target.value }))
          }
          rows={5}
          placeholder="Ce qui a été fait, observations, contraintes rencontrées, suite à prévoir..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        />
      </label>

      {selectedParcel ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          Reporting en cours pour <span className="font-medium text-slate-900">{selectedParcel.name || selectedParcel.idu}</span>.
        </div>
      ) : null}

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
          Les pièces jointes pourront être branchées ensuite via `attachments`.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Enregistrement..." : "Enregistrer le reporting"}
        </button>
      </div>
    </form>
  );
}
