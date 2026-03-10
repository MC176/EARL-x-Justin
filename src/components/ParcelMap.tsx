"use client";

import { useEffect, useRef } from "react";
import type { FeatureCollection } from "geojson";
import maplibregl, {
  type FilterSpecification,
  Map,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ParcelsGeoJSON } from "@/lib/api";
import type { Parcel } from "@/types/parcel";

/**
 * Fond OSM raster fiable.
 * Une future couche cadastrale pourra être ajoutée en créant une nouvelle source
 * puis une ou plusieurs layers entre "osm" et les couches "parcels-*".
 */
const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
    },
  ],
};

interface ParcelMapProps {
  featureCollection: ParcelsGeoJSON;
  selectedParcel?: Parcel | null;
  selectedParcelId?: string;
  onSelectParcel?: (parcelId: string) => void;
  selectedParcelIds?: string[];
  focusNonce?: number;
  heightClass?: string;
}

function getBoundsFromGeometry(
  geometry: { type?: string; coordinates?: unknown },
): maplibregl.LngLatBounds | null {
  if (!geometry?.coordinates || !Array.isArray(geometry.coordinates)) {
    return null;
  }

  const bounds = new maplibregl.LngLatBounds();
  let hasCoordinates = false;

  const visit = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      bounds.extend([value[0], value[1]]);
      hasCoordinates = true;
      return;
    }

    value.forEach(visit);
  };

  visit(geometry.coordinates);
  return hasCoordinates ? bounds : null;
}

function getBoundsFromFeatureCollection(
  collection: ParcelsGeoJSON,
): maplibregl.LngLatBounds | null {
  if (collection.bbox && collection.bbox.length === 4) {
    const [minLng, minLat, maxLng, maxLat] = collection.bbox;
    return new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
  }

  const bounds = new maplibregl.LngLatBounds();
  let hasAny = false;

  collection.features.forEach((feature) => {
    const geometry = (feature as { geometry?: { type?: string; coordinates?: unknown } })
      .geometry;
    if (!geometry) return;

    const featureBounds = getBoundsFromGeometry(geometry);
    if (!featureBounds) return;

    bounds.extend(featureBounds.getSouthWest());
    bounds.extend(featureBounds.getNorthEast());
    hasAny = true;
  });

  return hasAny ? bounds : null;
}

export function ParcelMap({
  featureCollection,
  selectedParcel,
  selectedParcelId,
  onSelectParcel,
  selectedParcelIds,
  focusNonce = 0,
  heightClass = "h-[70vh]",
}: ParcelMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const isMountedRef = useRef(true);
  const initialFeatureCollectionRef = useRef(featureCollection);
  const onSelectParcelRef = useRef(onSelectParcel);

  useEffect(() => {
    onSelectParcelRef.current = onSelectParcel;
  }, [onSelectParcel]);

  useEffect(() => {
    isMountedRef.current = true;

    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: OSM_STYLE as StyleSpecification,
      center: [4.85, 45.75],
      zoom: 8,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (!isMountedRef.current) return;

      map.addSource("parcels", {
        type: "geojson",
        data: initialFeatureCollectionRef.current as FeatureCollection,
      });

      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": [
            "match",
            ["get", "operational_tone"],
            "blue",
            "#0ea5e9",
            "green",
            "#22c55e",
            "orange",
            "#f59e0b",
            "red",
            "#f43f5e",
            "#94a3b8",
          ],
          "fill-opacity": 0.6,
        },
      });

      map.addLayer({
        id: "parcels-outline",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": "#333333",
          "line-width": 1,
        },
      });

      map.addLayer({
        id: "parcels-selected",
        type: "line",
        source: "parcels",
        filter: ["literal", false],
        paint: {
          "line-color": "#0f172a",
          "line-width": 3,
        },
      });

      const initialBounds = getBoundsFromFeatureCollection(
        initialFeatureCollectionRef.current,
      );
      if (initialBounds) {
        map.fitBounds(initialBounds, { padding: 40, maxZoom: 17 });
      }

      map.on("click", "parcels-fill", (event) => {
        if (!isMountedRef.current) return;

        const feature = event.features?.[0];
        if (!feature) return;

        const parcelId =
          (feature.properties?.parcel_id as string | undefined) ??
          (feature.properties?.idu as string | undefined);
        const name = feature.properties?.name as string | undefined;
        const status = feature.properties?.status as string | undefined;
        const operationalLabel = feature.properties?.operational_label as
          | string
          | undefined;

        if (parcelId && onSelectParcelRef.current) {
          onSelectParcelRef.current(parcelId);
        }

        new maplibregl.Popup()
          .setLngLat(event.lngLat)
          .setHTML(
            `<div style="font-size:12px;"><strong>${name ?? "Parcelle"}</strong><br/>${operationalLabel ?? ""}${status ? `<br/>Statut parcellaire: ${status}` : ""}</div>`,
          )
          .addTo(map);
      });
    });

    return () => {
      isMountedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMountedRef.current) return;
    if (!map.isStyleLoaded()) return;

    const source = map.getSource("parcels") as maplibregl.GeoJSONSource | undefined;
    if (!source || typeof source.setData !== "function") return;

    source.setData(featureCollection as FeatureCollection);
  }, [featureCollection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMountedRef.current) return;
    if (!map.isStyleLoaded()) return;

    if (map.getLayer("parcels-selected")) {
      let filter: FilterSpecification = ["literal", false];

      if (selectedParcelIds && selectedParcelIds.length > 0) {
        filter = [
          "in",
          ["get", "parcel_id"],
          ["literal", selectedParcelIds],
        ];
      } else if (selectedParcel) {
        filter = [
          "any",
          ["==", ["get", "parcel_id"], selectedParcel.parcel_id],
          ["==", ["get", "idu"], selectedParcel.idu],
        ];
      } else if (selectedParcelId) {
        filter = ["==", ["get", "parcel_id"], selectedParcelId];
      }

      map.setFilter("parcels-selected", filter);
    }
  }, [selectedParcel, selectedParcelId, selectedParcelIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMountedRef.current) return;
    if (!map.isStyleLoaded()) return;
    if (featureCollection.features.length === 0) return;

    if (selectedParcel?.geometry) {
      const selectedBounds = getBoundsFromGeometry(selectedParcel.geometry);
      if (selectedBounds) {
        map.fitBounds(selectedBounds, { padding: 60, maxZoom: 18 });
        return;
      }
    }

    if (selectedParcelId || selectedParcel?.idu) {
      const selectedFeature = featureCollection.features.find((feature) => {
        const props = (feature as {
          properties?: { parcel_id?: string; idu?: string };
        }).properties;

        return (
          props?.parcel_id === selectedParcelId ||
          props?.parcel_id === selectedParcel?.parcel_id ||
          props?.idu === selectedParcel?.idu
        );
      });

      const geometry = (
        selectedFeature as { geometry?: { type?: string; coordinates?: unknown } } | undefined
      )?.geometry;

      const selectedBounds = geometry ? getBoundsFromGeometry(geometry) : null;
      if (selectedBounds) {
        map.fitBounds(selectedBounds, { padding: 60, maxZoom: 18 });
        return;
      }
    }

    const allBounds = getBoundsFromFeatureCollection(featureCollection);
    if (allBounds) {
      map.fitBounds(allBounds, { padding: 40, maxZoom: 17 });
    }
  }, [featureCollection, selectedParcel, selectedParcelId, focusNonce]);

  return (
    <div className={`w-full overflow-hidden ${heightClass}`}>
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
