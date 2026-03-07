import { MapPageClient } from "@/components/MapPageClient";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Carte des parcelles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vue parcellaire interactive pour explorer les parcelles par
            exploitant.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Intervention du jour
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tout OK
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Actions en attente
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Incident / blocage
          </span>
        </div>
      </div>

      <MapPageClient />
    </div>
  );
}
