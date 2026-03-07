"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSurface } from "@/lib/format";
import { getAgronomicStatusMeta } from "@/lib/status";
import type { Parcel } from "@/types/parcel";
import type { ParcelOperationalSummary } from "@/types/operations";

const OWNER_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "maxime", label: "Maxime" },
  { value: "jean-marc", label: "Jean-Marc" },
];

interface ParcelMapSidebarProps {
  owner: string;
  onOwnerChange: (owner: string) => void;
  parcels: Parcel[];
  parcelSummaries: Record<string, ParcelOperationalSummary>;
  selectedParcel: Parcel | null;
  selectedParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
  loading?: boolean;
}

export function ParcelMapSidebar({
  owner,
  onOwnerChange,
  parcels,
  parcelSummaries,
  selectedParcel,
  selectedParcelId,
  onSelectParcel,
  loading = false,
}: ParcelMapSidebarProps) {
  const selectedSummary = selectedParcel
    ? parcelSummaries[selectedParcel.parcel_id]
    : null;
  const selectedAgronomicStatus = selectedParcel
    ? getAgronomicStatusMeta(selectedParcel.status)
    : null;

  return (
    <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:h-full lg:w-[320px] lg:border-t-0 lg:border-r lg:border-b-0">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Parcelles par exploitant
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sélectionnez une parcelle pour centrer la carte dessus.
        </p>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Exploitant
        </label>
        <select
          value={owner}
          onChange={(e) => onOwnerChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        >
          {OWNER_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto lg:max-h-full">
        {loading ? (
          <div className="px-4 py-6 text-sm text-slate-500">Chargement...</div>
        ) : null}

        {!loading && parcels.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Aucune parcelle disponible pour cet exploitant.
          </div>
        ) : null}

        {!loading ? (
          <ul className="divide-y divide-slate-100">
            {parcels.map((parcel) => {
              const isSelected = parcel.parcel_id === selectedParcelId;
              const summary = parcelSummaries[parcel.parcel_id];
              const agronomicStatus = getAgronomicStatusMeta(parcel.status);

              return (
                <li key={parcel.parcel_id}>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectParcel(parcel.parcel_id);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectParcel(parcel.parcel_id);
                    }}
                    className={`block w-full px-4 py-3 text-left transition ${
                      isSelected ? "bg-slate-100 ring-1 ring-inset ring-slate-300" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {parcel.name || parcel.idu}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {parcel.section} {parcel.numero}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {parcel.grape_variety || "Cépage non renseigné"}
                        </div>
                        {summary ? (
                          <div className="mt-2">
                            <StatusBadge
                              tone={summary.tone}
                              label={summary.label}
                              title={summary.description}
                            />
                          </div>
                        ) : null}
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${agronomicStatus.badgeClassName}`}
                      >
                        {agronomicStatus.label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {selectedParcel && selectedSummary && selectedAgronomicStatus ? (
          <div className="border-t border-slate-200 p-4">
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {selectedParcel.name || selectedParcel.idu}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedParcel.commune} · {selectedParcel.section}{" "}
                    {selectedParcel.numero}
                  </p>
                </div>
                <Link
                  href={`/parcels/${encodeURIComponent(selectedParcel.idu)}`}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Ouvrir
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/reporting?parcel_id=${encodeURIComponent(selectedParcel.parcel_id)}`}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Faire un compte-rendu
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={selectedSummary.tone}
                  label={selectedSummary.label}
                  title={selectedSummary.description}
                />
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[10px] font-medium ${selectedAgronomicStatus.badgeClassName}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${selectedAgronomicStatus.dotClassName}`}
                  />
                  {selectedAgronomicStatus.label}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <dt className="text-slate-400">Cépage</dt>
                  <dd className="mt-1">{selectedParcel.grape_variety || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Surface</dt>
                  <dd className="mt-1">{formatSurface(selectedParcel.area_m2)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Problèmes actifs</dt>
                  <dd className="mt-1">{selectedSummary.active_problems_total}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Actions en cours</dt>
                  <dd className="mt-1">
                    {selectedSummary.active_in_progress_total}
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-slate-600">{selectedSummary.description}</p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
