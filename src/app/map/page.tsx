import { MapPageClient } from "@/components/MapPageClient";

export default function MapPage() {
  return (
    <div className="space-y-5">
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Carte des parcelles
          </h1>
          <p className="mt-1 text-base text-slate-500">
            Vue parcellaire interactive pour explorer les parcelles par
            exploitant.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
          <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Intervention du jour
          </span>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tout OK
          </span>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Actions en attente
          </span>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Incident / blocage
          </span>
        </div>
      </div>

      <MapPageClient />
    </div>
  );
}
