import type { Parcel } from "@/types/parcel";
import type {
  ActivitySeverity,
  CommentActionState,
  ParcelComment,
  ParcelIncident,
  ParcelIntervention,
  ParcelOperationalSummary,
  ParcelReport,
  ParcelTask,
} from "@/types/operations";
import { isToday, relativeLabelFromNow } from "@/lib/format";

export interface StatusMeta {
  label: string;
  description?: string;
  badgeClassName: string;
  dotClassName: string;
}

const OPERATIONAL_META: Record<ActivitySeverity, StatusMeta> = {
  blue: {
    label: "Intervention du jour",
    description: "Une intervention a été enregistrée aujourd'hui.",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    dotClassName: "bg-sky-500",
  },
  green: {
    label: "Suivi OK",
    description: "Aucune alerte ni action en retard.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  orange: {
    label: "Action en attente",
    description: "Des tâches restent à traiter.",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  red: {
    label: "Bloquée / incident",
    description: "Une alerte critique est ouverte sur la parcelle.",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    dotClassName: "bg-rose-500",
  },
  slate: {
    label: "Sans signal",
    description: "Aucun signal métier récent.",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-700",
    dotClassName: "bg-slate-400",
  },
};

const AGRONOMIC_STATUS_META: Record<string, StatusMeta> = {
  active: {
    label: "Active",
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-800",
    dotClassName: "bg-emerald-500",
  },
  arachee: {
    label: "Arrachée",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
    dotClassName: "bg-slate-400",
  },
  non_plantee: {
    label: "Non plantée",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-800",
    dotClassName: "bg-amber-500",
  },
};

const COMMENT_STATE_META: Record<
  CommentActionState,
  StatusMeta & { tone: ActivitySeverity }
> = {
  note: {
    label: "Commentaire simple",
    description: "Information sans action persistante.",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-700",
    dotClassName: "bg-slate-400",
    tone: "green",
  },
  in_progress: {
    label: "En cours",
    description: "Action en cours sur la parcelle.",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
    tone: "orange",
  },
  done: {
    label: "Terminé",
    description: "Action ou problème clôturé explicitement.",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
    tone: "green",
  },
  problem: {
    label: "Problème",
    description: "Problème actif nécessitant une résolution explicite.",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    dotClassName: "bg-rose-500",
    tone: "red",
  },
};

function isTaskClosed(status?: string | null) {
  return ["done", "closed", "cancelled"].includes((status ?? "").toLowerCase());
}

function isIncidentOpen(status?: string | null) {
  return !["resolved", "closed", "cancelled"].includes(
    (status ?? "").toLowerCase(),
  );
}

export function getCommentStateMeta(
  state?: CommentActionState | null,
): StatusMeta & { tone: ActivitySeverity } {
  return COMMENT_STATE_META[state ?? "note"] ?? COMMENT_STATE_META.note;
}

export function getReportStatusMeta(
  status?: "in_progress" | "done" | "problem" | null,
) {
  return COMMENT_STATE_META[status ?? "in_progress"] ?? COMMENT_STATE_META.in_progress;
}

export function isActiveProblemComment(comment: ParcelComment) {
  return comment.action_state === "problem" && comment.is_active;
}

export function isActiveInProgressComment(comment: ParcelComment) {
  return comment.action_state === "in_progress" && comment.is_active;
}

export function isCompletedComment(comment: ParcelComment) {
  return comment.action_state === "done";
}

export function isActiveProblemReport(report: ParcelReport) {
  return report.status === "problem" && report.is_active;
}

export function isActiveInProgressReport(report: ParcelReport) {
  return report.status === "in_progress" && report.is_active;
}

export function isCompletedReport(report: ParcelReport) {
  return report.status === "done";
}

function getLastInterventionAt(
  interventions: ParcelIntervention[],
): string | null {
  const sorted = [...interventions].sort((a, b) =>
    `${b.date}T${b.start_time ?? "23:59:59"}`.localeCompare(
      `${a.date}T${a.start_time ?? "23:59:59"}`,
    ),
  );

  return sorted[0]
    ? `${sorted[0].date}T${sorted[0].end_time ?? sorted[0].start_time ?? "00:00:00"}`
    : null;
}

function getLastReportAt(reports: ParcelReport[]): string | null {
  const sorted = [...reports].sort((a, b) =>
    `${b.date}T${b.start_time ?? "23:59:59"}`.localeCompare(
      `${a.date}T${a.start_time ?? "23:59:59"}`,
    ),
  );

  return sorted[0]
    ? `${sorted[0].date}T${sorted[0].end_time ?? sorted[0].start_time ?? "00:00:00"}`
    : null;
}

export function getOperationalStatusMeta(tone: ActivitySeverity): StatusMeta {
  return OPERATIONAL_META[tone] ?? OPERATIONAL_META.slate;
}

export function getAgronomicStatusMeta(status?: string | null): StatusMeta {
  const fallbackStatus = status ?? "autre";

  return (
    AGRONOMIC_STATUS_META[fallbackStatus] ?? {
      label: fallbackStatus,
      badgeClassName: "border-sky-200 bg-sky-100 text-sky-800",
      dotClassName: "bg-sky-500",
    }
  );
}

export function buildParcelOperationalSummary({
  parcel,
  interventions,
  comments,
  reports,
  tasks,
  incidents,
}: {
  parcel: Parcel;
  interventions: ParcelIntervention[];
  comments: ParcelComment[];
  reports: ParcelReport[];
  tasks: ParcelTask[];
  incidents: ParcelIncident[];
}): ParcelOperationalSummary {
  const openIncidents = incidents.filter((incident) =>
    isIncidentOpen(incident.status),
  ).length;
  const activeProblemComments = comments.filter(isActiveProblemComment).length;
  const activeInProgressComments =
    comments.filter(isActiveInProgressComment).length;
  const activeProblemReports = reports.filter(isActiveProblemReport).length;
  const activeInProgressReports =
    reports.filter(isActiveInProgressReport).length;
  const completedCommentsRecently = comments.filter((comment) => {
    if (!isCompletedComment(comment)) return false;

    const diff = Date.now() - new Date(comment.created_at).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const completedReportsRecently = reports.filter((report) => {
    if (!isCompletedReport(report)) return false;

    const diff = Date.now() - new Date(report.created_at).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const overdueTasks = tasks.filter((task) => {
    if (!task.due_date || isTaskClosed(task.status)) {
      return false;
    }

    return task.due_date < new Date().toISOString().slice(0, 10);
  }).length;

  const pendingTasks = tasks.filter((task) => !isTaskClosed(task.status)).length;
  const recentComments = comments.filter((comment) => {
    const diff = Date.now() - new Date(comment.created_at).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const recentReports = reports.filter((report) => {
    const diff = Date.now() - new Date(report.created_at).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const hasInterventionToday = interventions.some((intervention) =>
    isToday(`${intervention.date}T${intervention.start_time ?? "00:00:00"}`),
  );
  const activeProblemsTotal = activeProblemComments + activeProblemReports;
  const activeInProgressTotal =
    activeInProgressComments + activeInProgressReports;
  const completedItemsRecently =
    completedCommentsRecently + completedReportsRecently;

  let tone: ActivitySeverity = "green";
  if (openIncidents > 0 || activeProblemsTotal > 0) {
    tone = "red";
  } else if (activeInProgressTotal > 0 || overdueTasks > 0 || pendingTasks > 0) {
    tone = "orange";
  } else if (hasInterventionToday) {
    tone = "blue";
  }

  const lastInterventionAt = getLastInterventionAt(interventions);
  const lastCommentAt = comments[0]?.created_at ?? null;
  const lastReportAt = getLastReportAt(reports);
  const lastActivityAt = [lastInterventionAt, lastCommentAt, lastReportAt]
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? null;

  const statusMeta = getOperationalStatusMeta(tone);
  const detailParts = [
    activeProblemsTotal > 0
      ? `${activeProblemsTotal} problème${activeProblemsTotal > 1 ? "s" : ""} actif${activeProblemsTotal > 1 ? "s" : ""}`
      : null,
    openIncidents > 0 ? `${openIncidents} incident${openIncidents > 1 ? "s" : ""} ouvert${openIncidents > 1 ? "s" : ""}` : null,
    activeInProgressTotal > 0
      ? `${activeInProgressTotal} action${activeInProgressTotal > 1 ? "s" : ""} en cours`
      : null,
    overdueTasks > 0 ? `${overdueTasks} tâche${overdueTasks > 1 ? "s" : ""} en retard` : null,
    pendingTasks > 0 && overdueTasks === 0
      ? `${pendingTasks} action${pendingTasks > 1 ? "s" : ""} en attente`
      : null,
    hasInterventionToday ? "Intervention saisie aujourd'hui" : null,
    recentComments > 0 ? `${recentComments} commentaire${recentComments > 1 ? "s" : ""} récent${recentComments > 1 ? "s" : ""}` : null,
    !lastActivityAt ? "Aucune activité récente" : null,
  ].filter(Boolean);

  return {
    parcel_id: parcel.parcel_id,
    tone,
    label: statusMeta.label,
    description: detailParts[0] ?? statusMeta.description ?? relativeLabelFromNow(lastActivityAt),
    open_incidents: openIncidents,
    overdue_tasks: overdueTasks,
    pending_tasks: pendingTasks,
    active_problem_comments: activeProblemComments,
    active_in_progress_comments: activeInProgressComments,
    completed_comments_recently: completedCommentsRecently,
    active_problem_reports: activeProblemReports,
    active_in_progress_reports: activeInProgressReports,
    completed_reports_recently: completedReportsRecently,
    active_problems_total: activeProblemsTotal,
    active_in_progress_total: activeInProgressTotal,
    completed_items_recently: completedItemsRecently,
    recent_comments: recentComments,
    recent_reports: recentReports,
    has_intervention_today: hasInterventionToday,
    last_intervention_at: lastInterventionAt,
    last_comment_at: lastCommentAt,
    last_report_at: lastReportAt,
    last_activity_at: lastActivityAt,
  };
}
