"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { QuickAddFab } from "@/components/QuickAddFab";
import { supabaseAuth } from "@/lib/supabase-auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Carte" },
  { href: "/parcels", label: "Parcelles" },
  { href: "/ajouter", label: "Ajouter" },
  { href: "/journal", label: "Journal" },
  { href: "/reporting", label: "Reporting" },
  { href: "/mon-compte", label: "Mon compte" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();

  async function handleLogout() {
    await supabaseAuth.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isLoginPage = pathname === "/login";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href={isLoginPage ? "/login" : "/dashboard"} className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Outil terrain
            </div>
            <div className="truncate text-lg font-semibold text-slate-900">
              Parcelles viticoles
            </div>
          </Link>

          {!isLoginPage ? (
            <div className="flex items-center gap-2">
              {user && profile ? (
                <div className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                  {profile.display_name}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white md:inline-flex"
              >
                Déconnexion
              </button>
            </div>
          ) : null}
        </div>

        {!isLoginPage ? (
          <div className="mx-auto hidden max-w-6xl px-6 pb-3 md:block lg:px-8">
            <nav className="flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href === "/mon-compte" && pathname === "/account");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ) : null}
      </header>

      {!isLoginPage ? (
        <>
          <QuickAddFab />
          <MobileBottomNav />
        </>
      ) : null}
    </>
  );
}
