"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  enrichFeatureCollectionWithOperationalStatus,
  getOwnerOptions,
  getParcels,
  getParcelsGeoJSON,
  parcelsToFeatureCollection,
  type ParcelsGeoJSON,
} from "@/lib/api";
import {
  getCommentsByParcelIds,
  getParcelOperationalSummaries,
} from "@/lib/operations";
import type { Parcel } from "@/types/parcel";
import type {
  ParcelComment,
  ParcelOperationalSummary,
} from "@/types/operations";
import { MapActionPanel } from "./MapActionPanel";
import { BulkCommentForm } from "./BulkCommentForm";
import { MultiParcelActionBar } from "./MultiParcelActionBar";
import { ParcelMap } from "./ParcelMap";
import { ParcelMapSidebar, type OwnerOption } from "./ParcelMapSidebar";

export function MapPageClient() {
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [owner, setOwner] = useState<string>("");
  const [ownerOptions, setOwnerOptions] = useState<OwnerOption[]>([
    { value: "", label: "Tous" },
  ]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [parcelSummaries, setParcelSummaries] = useState<
    Record<string, ParcelOperationalSummary>
  >({});
  const [comments, setComments] = useState<ParcelComment[]>([]);
  const [featureCollection, setFeatureCollection] = useState<ParcelsGeoJSON>({
    type: "FeatureCollection",
    features: [],
  });
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedParcelIds, setSelectedParcelIds] = useState<string[]>([]);
  const [bulkDefaultState, setBulkDefaultState] = useState<
    "in_progress" | "done" | "problem" | null
  >(null);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [focusNonce, setFocusNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (ownerFilter: string) => {
    setLoading(true);
    setError(null);

    try {
      if (ownerOptions.length <= 1) {
        const owners = await getOwnerOptions();
        setOwnerOptions([
          { value: "", label: "Tous" },
          ...owners.map((o) => ({ value: o.owner_code, label: o.owner_name })),
        ]);
      }

      const listData = await getParcels(ownerFilter ? { owner: ownerFilter } : {});
      const nextParcels = listData ?? [];
      setParcels(nextParcels);
      const parcelIds = nextParcels.map((parcel) => parcel.parcel_id);
      const summaries = await getParcelOperationalSummaries(
        ownerFilter ? { owner: ownerFilter } : {},
      );
      setParcelSummaries(summaries);
      setComments(await getCommentsByParcelIds(parcelIds));

      if (ownerFilter) {
        const geojson = await getParcelsGeoJSON({ owner: ownerFilter });
        setFeatureCollection(
          enrichFeatureCollectionWithOperationalStatus(geojson, summaries),
        );
      } else {
        setFeatureCollection(
          enrichFeatureCollectionWithOperationalStatus(
            parcelsToFeatureCollection(nextParcels),
            summaries,
          ),
        );
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
      setParcelSummaries({});
      setComments([]);
      setFeatureCollection({ type: "FeatureCollection", features: [] });
      setSelectedParcelId(null);
      setSelectedParcelIds([]);
    } finally {
      setLoading(false);
    }
  }, [ownerOptions.length]);

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

  const selectedParcelComments = useMemo(
    () =>
      selectedParcelId
        ? comments.filter((comment) => comment.parcel_id === selectedParcelId)
        : [],
    [comments, selectedParcelId],
  );

  const focusMapOnMobile = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!window.matchMedia("(max-width: 1023px)").matches) {
      return;
    }

    mapSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleSelectFromList = useCallback(
    (parcelId: string) => {
      if (selectionMode) {
        setSelectedParcelIds((current) => {
          const set = new Set(current);
          if (set.has(parcelId)) {
            set.delete(parcelId);
          } else {
            set.add(parcelId);
          }
          return Array.from(set);
        });
      } else {
        setSelectedParcelId(parcelId);
        setFocusNonce((value) => value + 1);
        setIsActionPanelOpen(false);
        focusMapOnMobile();
      }
    },
    [selectionMode, focusMapOnMobile],
  );

  const handleToggleParcelSelection = useCallback((parcelId: string) => {
    setSelectedParcelIds((current) => {
      const set = new Set(current);
      if (set.has(parcelId)) {
        set.delete(parcelId);
      } else {
        set.add(parcelId);
      }
      return Array.from(set);
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedParcelIds([]);
  }, []);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((current) => {
      const next = !current;
      if (!next) {
        setSelectedParcelIds([]);
      }
      return next;
    });
    setIsActionPanelOpen(false);
  }, []);

  const handleSelectFromMap = useCallback(
    (identifier: string) => {
      const matchedParcel =
        parcels.find((parcel) => parcel.parcel_id === identifier) ??
        parcels.find((parcel) => parcel.idu === identifier);

      const parcelId = matchedParcel?.parcel_id ?? identifier;

      if (selectionMode) {
        setSelectedParcelIds((current) => {
          const set = new Set(current);
          if (set.has(parcelId)) {
            set.delete(parcelId);
          } else {
            set.add(parcelId);
          }
          return Array.from(set);
        });
      } else {
        setSelectedParcelId(parcelId);
        setIsActionPanelOpen(true);
      }
    },
    [parcels, selectionMode],
  );

  const selectedParcelsForBulk = useMemo(
    () =>
      parcels.filter((parcel) => selectedParcelIds.includes(parcel.parcel_id)),
    [parcels, selectedParcelIds],
  );

  const handleOpenBulkForm = useCallback(
    (defaultState?: "in_progress" | "done" | "problem") => {
      if (selectedParcelsForBulk.length === 0) {
        return;
      }
      setBulkDefaultState(defaultState ?? "in_progress");
      setIsBulkFormOpen(true);
      setIsActionPanelOpen(false);
    },
    [selectedParcelsForBulk.length],
  );

  const handleBulkSubmitted = useCallback(async () => {
    setSelectedParcelIds([]);
    await loadData(owner);
  }, [loadData, owner]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[560px] flex-col lg:h-[calc(100vh-13rem)] lg:flex-row">
        <ParcelMapSidebar
          owner={owner}
          onOwnerChange={setOwner}
          ownerOptions={ownerOptions}
          parcels={sortedParcels}
          parcelSummaries={parcelSummaries}
          selectedParcel={selectedParcel}
          selectedParcelId={selectedParcelId}
          onSelectParcel={handleSelectFromList}
          selectionMode={selectionMode}
          selectedParcelIds={selectedParcelIds}
          onToggleSelectionMode={handleToggleSelectionMode}
          onToggleParcelSelection={handleToggleParcelSelection}
          onClearSelection={handleClearSelection}
          loading={loading}
        />

        <div
          ref={mapSectionRef}
          className="relative order-first h-[58vh] min-h-[360px] flex-1 bg-slate-100 lg:order-none lg:h-auto lg:min-h-[420px]"
        >
          {error ? (
            <div className="absolute left-3 top-3 z-10 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          ) : null}

          <ParcelMap
            featureCollection={featureCollection}
            selectedParcel={selectedParcel}
            selectedParcelId={selectedParcelId ?? undefined}
            selectedParcelIds={selectionMode ? selectedParcelIds : undefined}
            onSelectParcel={handleSelectFromMap}
            focusNonce={focusNonce}
            heightClass="h-full"
          />

          {selectedParcel &&
          parcelSummaries[selectedParcel.parcel_id] &&
          isActionPanelOpen ? (
            <MapActionPanel
              parcel={selectedParcel}
              summary={parcelSummaries[selectedParcel.parcel_id]}
              comments={selectedParcelComments}
              onClose={() => setIsActionPanelOpen(false)}
              onSaved={() => loadData(owner)}
            />
          ) : null}

          <MultiParcelActionBar
            selectedCount={selectedParcelIds.length}
            onOpenBulkComment={handleOpenBulkForm}
            onClearSelection={handleClearSelection}
          />

          {isBulkFormOpen && bulkDefaultState && selectedParcelsForBulk.length > 0 ? (
            <BulkCommentForm
              parcels={selectedParcelsForBulk}
              defaultState={bulkDefaultState}
              onClose={() => setIsBulkFormOpen(false)}
              onSubmitted={handleBulkSubmitted}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
