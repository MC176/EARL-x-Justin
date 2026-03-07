import Link from "next/link";
import { getParcels } from "@/lib/api";

export default async function ParcelsPage() {
  const parcels = await getParcels();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Parcelles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Liste simple des parcelles disponibles.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {parcels.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-500">
            Aucune parcelle trouvée.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {parcels.map((parcel) => (
              <li key={parcel.parcel_id}>
                <Link
                  href={`/parcels/${encodeURIComponent(parcel.idu)}`}
                  className="block px-4 py-4 transition hover:bg-slate-50"
                >
                  <div className="text-sm font-medium text-slate-900">
                    {parcel.name || parcel.idu}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    IDU : {parcel.idu}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Cépage : {parcel.grape_variety || "—"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
