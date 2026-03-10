import { supabase } from "@/lib/supabase";
import type { Parcel } from "@/types/parcel";
import type { ParcelOperationalSummary } from "@/types/operations";

export interface ParcelsGeoJSON {
  type: "FeatureCollection";
  features: unknown[];
  bbox?: [number, number, number, number];
}

export interface OwnerOption {
  owner_code: string;
  owner_name: string;
}

export async function getOwnerOptions(): Promise<OwnerOption[]> {
  const { data, error } = await supabase
    .from("parcels")
    .select("owner_code, owner_name")
    .not("owner_code", "is", null)
    .not("owner_name", "is", null);

  if (error) {
    throw new Error(`Erreur Supabase (owner options): ${error.message}`);
  }

  const unique = new Map<string, OwnerOption>();
  for (const row of (data ?? []) as Array<Partial<OwnerOption>>) {
    const code = row.owner_code?.trim();
    const name = row.owner_name?.trim();
    if (!code || !name) continue;
    if (!unique.has(code)) {
      unique.set(code, { owner_code: code, owner_name: name });
    }
  }

  return Array.from(unique.values()).sort((a, b) =>
    a.owner_name.localeCompare(b.owner_name, "fr"),
  );
}

export async function getParcels(params?: {
  owner?: string;
}): Promise<Parcel[]> {
  let query = supabase.from("parcels").select("*");

  if (params?.owner) {
    query = query.eq("owner_code", params.owner);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return (data ?? []) as Parcel[];
}

export async function getParcel(id: string): Promise<Parcel> {
  const { data, error } = await supabase
    .from("parcels")
    .select("*")
    .eq("parcel_id", id)
    .single();

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  if (!data) {
    throw new Error("Parcelle introuvable");
  }

  return data as Parcel;
}

export async function getParcelByIdu(idu: string): Promise<Parcel | null> {
  const { data, error } = await supabase
    .from("parcels")
    .select("*")
    .eq("idu", decodeURIComponent(idu))
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return data as Parcel;
}

export async function getParcelsGeoJSON(params?: {
  owner?: string;
}): Promise<ParcelsGeoJSON> {
  if (!params?.owner) {
    const parcels = await getParcels();
    return parcelsToFeatureCollection(parcels);
  }

  const { data, error } = await supabase.rpc("parcels_geojson", {
    owner: params.owner,
  });

  if (error) {
    throw new Error(`Erreur Supabase (parcels_geojson): ${error.message}`);
  }

  if (!data) {
    return { type: "FeatureCollection", features: [] };
  }

  return data as ParcelsGeoJSON;
}

export function parcelsToFeatureCollection(
  parcels: Parcel[],
): ParcelsGeoJSON {
  const features = parcels
    .filter((p) => p.geometry && p.geometry.coordinates)
    .map((p) => ({
      type: "Feature" as const,
      geometry: p.geometry!,
      properties: {
        parcel_id: p.parcel_id,
        name: p.name || p.idu,
        grape_variety: p.grape_variety ?? undefined,
        status: p.status ?? undefined,
        owner_code: p.owner_code,
        owner_name: p.owner_name,
      },
    }));
  return { type: "FeatureCollection", features };
}

export function enrichFeatureCollectionWithOperationalStatus(
  featureCollection: ParcelsGeoJSON,
  summaries: Record<string, ParcelOperationalSummary>,
): ParcelsGeoJSON {
  return {
    ...featureCollection,
    features: featureCollection.features.map((feature) => {
      const typedFeature = feature as {
        type: "Feature";
        geometry: unknown;
        properties?: Record<string, unknown>;
      };
      const parcelId = typedFeature.properties?.parcel_id as string | undefined;
      const summary = parcelId ? summaries[parcelId] : undefined;

      return {
        ...typedFeature,
        properties: {
          ...typedFeature.properties,
          operational_tone: summary?.tone ?? "slate",
          operational_label: summary?.label ?? "Sans signal",
          operational_description: summary?.description ?? null,
        },
      };
    }),
  };
}
