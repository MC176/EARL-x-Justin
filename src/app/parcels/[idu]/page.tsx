import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Parcel } from "@/types/parcel";

interface ParcelDetailPageProps {
  params: Promise<{ idu: string }>;
}

export default async function ParcelDetailPage({
  params,
}: ParcelDetailPageProps) {
  const { idu } = await params;

  const { data, error } = await supabase
    .from("parcels")
    .select("*")
    .eq("idu", decodeURIComponent(idu))
    .single();

  if (error || !data) {
    notFound();
  }

  const parcel = data as Parcel;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {parcel.name || parcel.idu}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Détail de la parcelle</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              IDU
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{parcel.idu}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Nom
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{parcel.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Cépage
            </dt>
            <dd className="mt-1 text-sm text-slate-900">
              {parcel.grape_variety || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Statut
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{parcel.status}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
