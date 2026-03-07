"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthAccountByFirstName } from "@/lib/authAccounts";
import { supabaseAuth } from "@/lib/supabase-auth";

const QUICK_FIRST_NAMES = ["Maxime", "Jean-Marc", "Tristan", "Justin"] as const;

export function LoginForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const account = getAuthAccountByFirstName(firstName);
    if (!account) {
      setError(
        "Prénom non reconnu. Utilisez Maxime, Jean-Marc, Tristan ou Justin.",
      );
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: account.email,
      password,
    });

    if (signInError) {
      setError("Connexion impossible. Vérifiez le prénom et le mot de passe.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Connexion</h1>
        <p className="text-base text-slate-500">
          Entrez votre prénom puis votre mot de passe.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {QUICK_FIRST_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setFirstName(name);
              setError(null);
            }}
            className={`min-h-14 rounded-2xl border px-4 text-base font-semibold transition ${
              firstName === name
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <label className="block text-sm text-slate-700">
        <span className="mb-2 block text-base font-medium text-slate-900">Prénom</span>
        <input
          type="text"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Ex: Maxime"
          className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          autoComplete="username"
          required
        />
      </label>

      <label className="block text-sm text-slate-700">
        <span className="mb-2 block text-base font-medium text-slate-900">
          Mot de passe
        </span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-slate-400"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-slate-900 px-6 text-lg font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
