import Link from "next/link";
import { getParcels } from "@/lib/api";
import { DashboardStats } from "@/components/DashboardStats";

export default async function DashboardPage() {
  const parcels = await getParcels({ owner: "maxime" });

  const total = parcels.length;
  const active = parcels.filter((p) => p.status === "active").length;
  const arachee = parcels.filter((p) => p.status === "arachee").length;
  const nonPlantee = parcels.filter((p) => p.status === "non_plantee").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Vue synthétique des parcelles de Maxime.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/parcels"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-slate-800"
          >
            Voir la liste
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-xs hover:bg-slate-50"
          >
            Ouvrir la carte
          </Link>
        </div>
      </div>

      <DashboardStats
        total={total}
        active={active}
        arachee={arachee}
        nonPlantee={nonPlantee}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-xs">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Rappels du MVP
        </h2>
        <ul className="list-disc space-y-1 pl-4">
          <li>Affichage des parcelles métier (table parcels).</li>
          <li>Filtrage sur l&apos;exploitant Maxime.</li>
          <li>Interventions et commentaires à venir.</li>
        </ul>
      </section>
    </div>
  );
}
