"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getParcels,
  getParcelsGeoJSON,
  parcelsToFeatureCollection,
  type ParcelsGeoJSON,
} from "@/lib/api";
import type { Parcel } from "@/types/parcel";
import { ParcelMap } from "./ParcelMap";
import { ParcelMapSidebar } from "./ParcelMapSidebar";

export function MapPageClient() {
  const [owner, setOwner] = useState<string>("maxime");
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [featureCollection, setFeatureCollection] = useState<ParcelsGeoJSON>({
    type: "FeatureCollection",
    features: [],
  });
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (ownerFilter: string) => {
    setLoading(true);
    setError(null);

    try {
      const listData = await getParcels(ownerFilter ? { owner: ownerFilter } : {});
      const nextParcels = listData ?? [];
      setParcels(nextParcels);

      if (ownerFilter) {
        const geojson = await getParcelsGeoJSON({ owner: ownerFilter });
        setFeatureCollection(geojson);
      } else {
        setFeatureCollection(parcelsToFeatureCollection(nextParcels));
      }

      setSelectedParcelId((currentSelection) => {
        if (nextParcels.length === 0) {
          return null;
        }

        const selectionStillVisible =
          currentSelection &&
          nextParcels.some((parcel) => parcel.parcel_id === currentSelection);

        return selectionStillVisible
          ? currentSelection
          : nextParcels[0].parcel_id;
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible de charger les parcelles et la carte.",
      );
      setParcels([]);
      setFeatureCollection({ type: "FeatureCollection", features: [] });
      setSelectedParcelId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(owner);
  }, [owner, loadData]);

  const sortedParcels = useMemo(
    () =>
      [...parcels].sort((a, b) =>
        (a.name || a.idu).localeCompare(b.name || b.idu),
      ),
    [parcels],
  );

  const selectedParcel = useMemo(
    () =>
      selectedParcelId
        ? parcels.find((parcel) => parcel.parcel_id === selectedParcelId) ?? null
        : null,
    [parcels, selectedParcelId],
  );

  const handleSelectFromList = useCallback((parcelId: string) => {
    setSelectedParcelId(parcelId);
    setFocusNonce((value) => value + 1);
  }, []);

  const handleSelectFromMap = useCallback(
    (identifier: string) => {
      const matchedParcel =
        parcels.find((parcel) => parcel.parcel_id === identifier) ??
        parcels.find((parcel) => parcel.idu === identifier);

      setSelectedParcelId(matchedParcel?.parcel_id ?? identifier);
    },
    [parcels],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-[calc(100vh-13rem)] min-h-[560px] flex-col lg:flex-row">
        <ParcelMapSidebar
          owner={owner}
          onOwnerChange={setOwner}
          parcels={sortedParcels}
          selectedParcelId={selectedParcelId}
          onSelectParcel={handleSelectFromList}
          loading={loading}
        />

        <div className="relative min-h-[420px] flex-1 bg-slate-100">
          {error ? (
            <div className="absolute left-3 top-3 z-10 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          ) : null}

          <ParcelMap
            featureCollection={featureCollection}
            selectedParcel={selectedParcel}
            selectedParcelId={selectedParcelId ?? undefined}
            onSelectParcel={handleSelectFromMap}
            focusNonce={focusNonce}
            heightClass="h-full"
          />
        </div>
      </div>
    </div>
  );
}
