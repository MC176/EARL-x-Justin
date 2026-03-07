"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const ACTIONS = [
  {
    href: "/ajouter?action=intervention",
    label: "Ajouter intervention",
  },
  {
    href: "/ajouter?action=commentaire",
    label: "Ajouter commentaire",
  },
  {
    href: "/ajouter?action=reporting",
    label: "Ajouter reporting",
  },
  {
    href: "/ajouter?action=probleme",
    label: "Signaler problème",
  },
] as const;

export function QuickAddFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const hidden = useMemo(
    () => pathname === "/login" || pathname === "/ajouter",
    [pathname],
  );

  if (hidden) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 md:hidden">
      {open ? (
        <div className="mb-3 w-64 space-y-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center rounded-2xl bg-slate-100 px-4 text-base font-medium text-slate-900"
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Ouvrir les actions rapides"
        className="ml-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-3xl text-white shadow-xl"
      >
        {open ? "×" : "+"}
      </button>
    </div>
  );
}
