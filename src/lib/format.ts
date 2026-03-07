export function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 5);
}

export function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null,
) {
  if (!startTime && !endTime) return "Horaire non renseigné";
  if (startTime && endTime) return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  if (startTime) return `Début ${formatTime(startTime)}`;
  return `Fin ${formatTime(endTime)}`;
}

export function formatSurface(areaM2?: number | null) {
  if (!areaM2) return "—";

  if (areaM2 >= 10000) {
    return `${(areaM2 / 10000).toFixed(2)} ha`;
  }

  return `${Math.round(areaM2)} m²`;
}

export function isToday(value?: string | null) {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function relativeLabelFromNow(value?: string | null) {
  if (!value) return "Aucune activité récente";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 60) {
    return `Il y a ${Math.max(diffMinutes, 1)} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Il y a ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `Il y a ${diffDays} j`;
}
