"use client";

interface MultiParcelActionBarProps {
  selectedCount: number;
  onOpenBulkComment: (defaultState?: "in_progress" | "done" | "problem") => void;
  onClearSelection: () => void;
}

export function MultiParcelActionBar({
  selectedCount,
  onOpenBulkComment,
  onClearSelection,
}: MultiParcelActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 sm:static sm:px-0 sm:pb-0">
      <div className="pointer-events-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/95 px-3 py-3 text-sm shadow-lg backdrop-blur sm:rounded-2xl sm:px-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-semibold text-white">
            {selectedCount}
          </span>
          <span className="hidden text-sm text-slate-700 sm:inline">
            parcelle{selectedCount > 1 ? "s" : ""} sélectionnée
            {selectedCount > 1 ? "s" : ""}
          </span>
          <span className="text-sm text-slate-700 sm:hidden">
            {selectedCount} sélection
            {selectedCount > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenBulkComment()}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-slate-900 px-3 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 sm:flex-none sm:px-4 sm:text-sm"
          >
            Commentaire groupé
          </button>
          <button
            type="button"
            onClick={() => onOpenBulkComment("in_progress")}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100 sm:px-4 sm:text-sm"
          >
            En cours
          </button>
          <button
            type="button"
            onClick={() => onOpenBulkComment("done")}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 sm:px-4 sm:text-sm"
          >
            Terminé
          </button>
          <button
            type="button"
            onClick={() => onOpenBulkComment("problem")}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-800 hover:bg-rose-100 sm:px-4 sm:text-sm"
          >
            Problème
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:px-4 sm:text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

