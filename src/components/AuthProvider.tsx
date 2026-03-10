"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseAuth } from "@/lib/supabase-auth";
import type { Profile } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(user: User | null) {
  if (!user) {
    return null;
  }

  const { data, error } = await supabaseAuth
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    const displayName =
      (user.user_metadata.display_name as string | undefined) ??
      (user.user_metadata.first_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Utilisateur";

    return {
      id: user.id,
      first_name:
        (user.user_metadata.first_name as string | undefined) ?? displayName,
      display_name: displayName,
      role: "operator",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies Profile;
  }

  return data as Profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    setProfile(await fetchProfile(user));
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabaseAuth.auth.getSession();

        if (error) {
          const message = error.message ?? "";
          if (
            message.toLowerCase().includes("refresh token") ||
            message.toLowerCase().includes("invalid refresh token")
          ) {
            await supabaseAuth.auth.signOut();
          }
        }

        if (!isMounted) return;

        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setProfile(await fetchProfile(nextUser));
        setLoading(false);
      } catch {
        await supabaseAuth.auth.signOut();
        if (!isMounted) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }

    loadInitialSession();

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setProfile(await fetchProfile(nextUser));
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
    }),
    [user, profile, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }

  return context;
}
