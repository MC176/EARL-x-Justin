"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/map", label: "Carte", icon: "📍" },
  { href: "/parcels", label: "Parcelles", icon: "🌱" },
  { href: "/ajouter", label: "Ajouter", icon: "➕" },
  { href: "/journal", label: "Journal", icon: "📜" },
  { href: "/mon-compte", label: "Compte", icon: "👤" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/mon-compte" && pathname === "/account");

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-[64px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-center ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="mt-1 text-[11px] font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
