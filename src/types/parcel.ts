export type ParcelStatus = "active" | "arachee" | "non_plantee" | string;

export interface Parcel {
  parcel_id: string;
  idu: string;
  commune: string;
  prefixe: string | null;
  section: string;
  numero: string;
  contenance: number | null;
  name: string;
  grape_variety: string | null;
  area_m2: number | null;
  notes: string | null;
  status: ParcelStatus;
  owner_code: string;
  owner_name: string;
  geometry?: {
    type: string;
    coordinates: unknown[];
  } | null;
}
