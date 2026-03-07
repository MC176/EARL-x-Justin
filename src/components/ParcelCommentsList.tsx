import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { getCommentStateMeta } from "@/lib/status";
import type { Parcel } from "@/types/parcel";
import type { ParcelComment } from "@/types/operations";

interface ParcelCommentsListProps {
  comments: ParcelComment[];
  parcelsById?: Record<string, Parcel>;
  emptyMessage?: string;
}

export function ParcelCommentsList({
  comments,
  parcelsById,
  emptyMessage = "Aucun commentaire enregistré.",
}: ParcelCommentsListProps) {
  if (comments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-base text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => {
        const parcel = parcelsById?.[comment.parcel_id];
        const stateMeta = getCommentStateMeta(comment.action_state);
        const content = (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${stateMeta.badgeClassName}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${stateMeta.dotClassName}`} />
                    {stateMeta.label}
                  </span>
                  <span className="text-base font-medium text-slate-900">
                    {comment.author_name}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatDateTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-base text-slate-700">{comment.content}</p>
                <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                  {comment.is_active ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Élément actif
                    </span>
                  ) : null}
                  {comment.action_state === "done" && comment.closes_comment_id ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      Clôture explicite enregistrée
                    </span>
                  ) : null}
                  {!comment.is_active && comment.closed_at ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      Clôturé le {formatDateTime(comment.closed_at)}
                    </span>
                  ) : null}
                </div>
              </div>

              {parcel ? (
                <div className="shrink-0 text-sm text-slate-500 sm:text-right">
                  <div>{parcel.name || parcel.idu}</div>
                  <div className="mt-1">IDU {parcel.idu}</div>
                </div>
              ) : null}
            </div>
          </div>
        );

        return (
          <li key={comment.id}>
            {parcel ? (
              <Link
                href={`/parcels/${encodeURIComponent(parcel.idu)}`}
                className="block"
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
