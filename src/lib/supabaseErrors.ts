export function getSupabaseUiErrorMessage(
  error: { message?: string; code?: string } | null,
  fallback: string,
) {
  if (!error) return fallback;

  const message = (error.message ?? "").toLowerCase();

  if (
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("column") && message.includes("does not exist")
  ) {
    return "Les tables métier ne sont pas encore créées dans Supabase. Exécutez d'abord la migration SQL.";
  }

  return fallback;
}
