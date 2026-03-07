"use client";

import type { Parcel } from "@/types/parcel";

const OWNER_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "maxime", label: "Maxime" },
  { value: "jean-marc", label: "Jean-Marc" },
];

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  arachee: "Arrachée",
  non_plantee: "Non plantée",
};

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-100 text-emerald-800",
  arachee: "border-slate-200 bg-slate-100 text-slate-700",
  non_plantee: "border-amber-200 bg-amber-100 text-amber-800",
};

interface ParcelMapSidebarProps {
  owner: string;
  onOwnerChange: (owner: string) => void;
  parcels: Parcel[];
  selectedParcelId: string | null;
  onSelectParcel: (parcelId: string) => void;
  loading?: boolean;
}

export function ParcelMapSidebar({
  owner,
  onOwnerChange,
  parcels,
  selectedParcelId,
  onSelectParcel,
  loading = false,
}: ParcelMapSidebarProps) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-[320px] lg:border-b-0 lg:border-r">
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

      <div className="flex-1 overflow-y-auto">
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
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                          STATUS_STYLES[parcel.status] ??
                          "border-sky-200 bg-sky-100 text-sky-800"
                        }`}
                      >
                        {STATUS_LABELS[parcel.status] ?? parcel.status}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}
