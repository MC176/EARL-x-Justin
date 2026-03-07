import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/auth";

export function buildAuthorPayload(user: User, profile: Profile | null) {
  return {
    author_id: user.id,
    author_name:
      profile?.display_name ??
      profile?.first_name ??
      (user.user_metadata.display_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Utilisateur",
    author_code: user.email ?? null,
  };
}
