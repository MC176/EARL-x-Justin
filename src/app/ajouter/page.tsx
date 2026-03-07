import { AddPageClient } from "@/components/AddPageClient";
import { getParcels } from "@/lib/api";
import { getCommentsByParcelIds, getReportsByParcelIds } from "@/lib/operations";

interface AjouterPageProps {
  searchParams: Promise<{
    action?: "intervention" | "commentaire" | "reporting" | "probleme";
    parcel_id?: string;
  }>;
}

export default async function AjouterPage({ searchParams }: AjouterPageProps) {
  const { action, parcel_id: parcelId } = await searchParams;
  const parcels = await getParcels();
  const parcelIds = parcels.map((parcel) => parcel.parcel_id);
  const [comments, reports] = await Promise.all([
    getCommentsByParcelIds(parcelIds),
    getReportsByParcelIds(parcelIds),
  ]);

  return (
    <AddPageClient
      parcels={parcels}
      comments={comments}
      reports={reports}
      initialParcelId={parcelId}
      initialAction={action}
    />
  );
}
