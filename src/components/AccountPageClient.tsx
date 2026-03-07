"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabaseAuth } from "@/lib/supabase-auth";

export function AccountPageClient() {
  const router = useRouter();
  const { profile } = useAuth();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error: updateError } = await supabaseAuth.auth.updateUser({
      password,
    });

    if (updateError) {
      setError("Impossible de modifier le mot de passe pour le moment.");
      setLoading(false);
      return;
    }

    setMessage("Mot de passe mis à jour.");
    setPassword("");
    setLoading(false);
  }

  async function handleLogout() {
    await supabaseAuth.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <h1 className="text-2xl font-semibold text-slate-900">Mon compte</h1>
        <p className="mt-1 text-base text-slate-500">
          Gérez votre session, votre identité affichée et votre mot de passe.
        </p>
      </div>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Profil</h2>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Prénom
            </dt>
            <dd className="mt-1 text-base text-slate-900">
              {profile?.first_name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Nom affiché
            </dt>
            <dd className="mt-1 text-base text-slate-900">
              {profile?.display_name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Compte
            </dt>
            <dd className="mt-1 text-base text-slate-900">Compte métier local</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Rôle
            </dt>
            <dd className="mt-1 text-base text-slate-900">{profile?.role ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Changer le mot de passe
          </h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <label className="block text-sm text-slate-700">
            <span className="mb-2 block text-base font-medium text-slate-900">Nouveau mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-slate-900 px-6 text-base font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-base font-semibold text-slate-800 shadow-xs hover:bg-slate-50"
            >
              Déconnexion
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
