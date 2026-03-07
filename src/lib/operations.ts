import { getParcelByIdu, getParcels } from "@/lib/api";
import { isToday } from "@/lib/format";
import {
  buildParcelOperationalSummary,
  getCommentStateMeta,
  getReportStatusMeta,
  isActiveInProgressComment,
  isActiveProblemComment,
  isCompletedComment,
  isActiveInProgressReport,
  isActiveProblemReport,
  isCompletedReport,
} from "@/lib/status";
import { supabase } from "@/lib/supabase";
import type { Parcel } from "@/types/parcel";
import type {
  ActivityFeedItem,
  ActivityLogEntry,
  Attachment,
  DashboardAlert,
  DashboardData,
  ParcelComment,
  ParcelIncident,
  ParcelIntervention,
  ParcelOperationalSummary,
  ParcelReport,
  ParcelTask,
} from "@/types/operations";

function isMissingRelationError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) return false;

  const message = (error.message ?? "").toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    (message.includes("relation") && message.includes("does not exist"))
  );
}

async function safeListQuery<T>(
  query: PromiseLike<{
    data: T[] | null;
    error: { code?: string; message?: string } | null;
  }>,
  tableName: string,
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    if (isMissingRelationError(error)) {
      console.warn(`[supabase] table "${tableName}" indisponible: ${error.message}`);
      return [];
    }

    throw new Error(`Erreur Supabase (${tableName}): ${error.message}`);
  }

  return data ?? [];
}

async function safeSingleQuery<T>(
  query: PromiseLike<{
    data: T | null;
    error: { code?: string; message?: string } | null;
  }>,
  tableName: string,
): Promise<T | null> {
  const { data, error } = await query;

  if (error) {
    if (isMissingRelationError(error)) {
      console.warn(`[supabase] table "${tableName}" indisponible: ${error.message}`);
      return null;
    }

    throw new Error(`Erreur Supabase (${tableName}): ${error.message}`);
  }

  return data;
}

function groupByParcelId<T extends { parcel_id: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((accumulator, item) => {
    if (!accumulator[item.parcel_id]) {
      accumulator[item.parcel_id] = [];
    }

    accumulator[item.parcel_id].push(item);
    return accumulator;
  }, {});
}

function buildParcelLookup(parcels: Parcel[]) {
  return parcels.reduce<Record<string, Parcel>>((accumulator, parcel) => {
    accumulator[parcel.parcel_id] = parcel;
    return accumulator;
  }, {});
}

function getParcelLabel(parcel?: Parcel | null, fallback?: string | null) {
  return parcel?.name || parcel?.idu || fallback || "Parcelle";
}

function getCommentActivityCopy(comment: ParcelComment) {
  const stateMeta = getCommentStateMeta(comment.action_state);

  if (comment.action_state === "todo") {
    return {
      title: `${comment.author_name} a ajouté une action à faire`,
      severity: stateMeta.tone,
      stateLabel: stateMeta.label,
    };
  }

  if (comment.action_state === "in_progress") {
    return {
      title: `${comment.author_name} a signalé une action en cours`,
      severity: stateMeta.tone,
      stateLabel: stateMeta.label,
    };
  }

  if (comment.action_state === "problem") {
    return {
      title: `${comment.author_name} a signalé un problème`,
      severity: stateMeta.tone,
      stateLabel: stateMeta.label,
    };
  }

  if (comment.action_state === "done") {
    return {
      title: `${comment.author_name} a marqué une action comme terminée`,
      severity: stateMeta.tone,
      stateLabel: stateMeta.label,
    };
  }

  return {
    title: `${comment.author_name} a ajouté un commentaire`,
    severity: stateMeta.tone,
    stateLabel: stateMeta.label,
  };
}

function getReportActivityCopy(report: ParcelReport) {
  const statusMeta = getReportStatusMeta(report.status);

  if (report.status === "in_progress") {
    return {
      title: `${report.author_name} a renseigné un reporting en cours`,
      severity: statusMeta.tone,
      stateLabel: statusMeta.label,
    };
  }

  if (report.status === "problem") {
    return {
      title: `${report.author_name} a signalé un problème via reporting`,
      severity: statusMeta.tone,
      stateLabel: statusMeta.label,
    };
  }

  return {
    title: `${report.author_name} a clôturé un reporting`,
    severity: statusMeta.tone,
    stateLabel: statusMeta.label,
  };
}

function mapActivityLogToFeed(
  activity: ActivityLogEntry[],
  parcelLookup: Record<string, Parcel>,
): ActivityFeedItem[] {
  return activity.map((item) => {
    const parcel = item.parcel_id ? parcelLookup[item.parcel_id] : null;
    const actionState =
      typeof item.metadata?.action_state === "string"
        ? item.metadata.action_state
        : null;
    const reportStatus =
      typeof item.metadata?.report_status === "string"
        ? item.metadata.report_status
        : null;
    const stateLabel =
      actionState && ["note", "todo", "in_progress", "done", "problem"].includes(actionState)
        ? getCommentStateMeta(actionState as ParcelComment["action_state"]).label
        : reportStatus && ["in_progress", "done", "problem"].includes(reportStatus)
          ? getReportStatusMeta(reportStatus as ParcelReport["status"]).label
          : undefined;

    return {
      id: item.id,
      parcel_id: item.parcel_id,
      parcel_label: getParcelLabel(parcel, item.parcel_id),
      event_type: item.event_type,
      title: item.title,
      description: item.description,
      actor_name: item.actor_name,
      actor_code: item.actor_code,
      severity: item.severity ?? "slate",
      state_label: stateLabel,
      created_at: item.created_at,
      href: item.parcel_id
        ? `/parcels/${encodeURIComponent(parcel?.idu ?? item.parcel_id)}`
        : undefined,
    };
  });
}

function buildFallbackFeed({
  interventions,
  comments,
  reports,
  incidents,
  tasks,
  parcelLookup,
}: {
  interventions: ParcelIntervention[];
  comments: ParcelComment[];
  reports: ParcelReport[];
  incidents: ParcelIncident[];
  tasks: ParcelTask[];
  parcelLookup: Record<string, Parcel>;
}): ActivityFeedItem[] {
  const interventionItems: ActivityFeedItem[] = interventions.map((item) => {
    const parcel = parcelLookup[item.parcel_id];

    return {
      id: `intervention-${item.id}`,
      parcel_id: item.parcel_id,
      parcel_label: getParcelLabel(parcel, item.parcel_id),
      event_type: "intervention",
      title: `${item.author_name} a enregistré ${item.intervention_type.toLowerCase()}`,
      description: getParcelLabel(parcel, item.parcel_id),
      actor_name: item.author_name,
      actor_code: item.author_code,
      severity: isToday(`${item.date}T${item.start_time ?? "00:00:00"}`)
        ? "blue"
        : "green",
      created_at: `${item.date}T${item.end_time ?? item.start_time ?? "00:00:00"}`,
      href: parcel ? `/parcels/${encodeURIComponent(parcel.idu)}` : undefined,
    };
  });

  const commentItems: ActivityFeedItem[] = comments.map((item) => {
    const parcel = parcelLookup[item.parcel_id];
    const copy = getCommentActivityCopy(item);

    return {
      id: `comment-${item.id}`,
      parcel_id: item.parcel_id,
      parcel_label: getParcelLabel(parcel, item.parcel_id),
      event_type: "comment",
      title: copy.title,
      description: item.content,
      actor_name: item.author_name,
      actor_code: item.author_code,
      severity: copy.severity,
      state_label: copy.stateLabel,
      created_at: item.created_at,
      href: parcel ? `/parcels/${encodeURIComponent(parcel.idu)}` : undefined,
    };
  });

  const reportItems: ActivityFeedItem[] = reports.map((item) => {
    const parcel = parcelLookup[item.parcel_id];
    const copy = getReportActivityCopy(item);

    return {
      id: `report-${item.id}`,
      parcel_id: item.parcel_id,
      parcel_label: getParcelLabel(parcel, item.parcel_id),
      event_type: "report",
      title: copy.title,
      description: `${item.report_type} - ${item.summary}`,
      actor_name: item.author_name,
      actor_code: item.author_code,
      severity: copy.severity,
      state_label: copy.stateLabel,
      created_at: item.created_at,
      href: parcel ? `/parcels/${encodeURIComponent(parcel.idu)}` : undefined,
    };
  });

  const incidentItems: ActivityFeedItem[] = incidents.map((item) => {
    const parcel = parcelLookup[item.parcel_id];

    return {
      id: `incident-${item.id}`,
      parcel_id: item.parcel_id,
      parcel_label: getParcelLabel(parcel, item.parcel_id),
      event_type: "incident",
      title: item.title,
      description: item.description,
      actor_name: item.reported_by_name,
      actor_code: item.reported_by_code,
      severity: item.severity ?? "red",
      created_at: item.created_at,
      href: parcel ? `/parcels/${encodeURIComponent(parcel.idu)}` : undefined,
    };
  });

  const taskItems: ActivityFeedItem[] = tasks.map((item) => {
    const parcel = parcelLookup[item.parcel_id];

    return {
      id: `task-${item.id}`,
      parcel_id: item.parcel_id,
      parcel_label: getParcelLabel(parcel, item.parcel_id),
      event_type: "task",
      title: item.title,
      description: item.description,
      actor_name: item.created_by_name,
      actor_code: item.created_by_code,
      severity: "orange",
      created_at: item.created_at,
      href: parcel ? `/parcels/${encodeURIComponent(parcel.idu)}` : undefined,
    };
  });

  return [...interventionItems, ...commentItems, ...reportItems, ...incidentItems, ...taskItems].sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );
}

function buildParcelSummaries(
  parcels: Parcel[],
  interventions: ParcelIntervention[],
  comments: ParcelComment[],
  reports: ParcelReport[],
  tasks: ParcelTask[],
  incidents: ParcelIncident[],
) {
  const interventionsByParcel = groupByParcelId(interventions);
  const commentsByParcel = groupByParcelId(comments);
  const reportsByParcel = groupByParcelId(reports);
  const tasksByParcel = groupByParcelId(tasks);
  const incidentsByParcel = groupByParcelId(incidents);

  return parcels.reduce<Record<string, ParcelOperationalSummary>>(
    (accumulator, parcel) => {
      accumulator[parcel.parcel_id] = buildParcelOperationalSummary({
        parcel,
        interventions: interventionsByParcel[parcel.parcel_id] ?? [],
        comments: commentsByParcel[parcel.parcel_id] ?? [],
        reports: reportsByParcel[parcel.parcel_id] ?? [],
        tasks: tasksByParcel[parcel.parcel_id] ?? [],
        incidents: incidentsByParcel[parcel.parcel_id] ?? [],
      });

      return accumulator;
    },
    {},
  );
}

function buildAlerts({
  parcels,
  activeProblemComments,
  activeProblemReports,
  incidents,
}: {
  parcels: Parcel[];
  activeProblemComments: ParcelComment[];
  activeProblemReports: ParcelReport[];
  incidents: ParcelIncident[];
}): DashboardAlert[] {
  const parcelLookup = buildParcelLookup(parcels);

  const commentAlerts = activeProblemComments.map<DashboardAlert>((comment) => ({
    id: `problem-comment-${comment.id}`,
    parcel_id: comment.parcel_id,
    parcel_label: getParcelLabel(
      parcelLookup[comment.parcel_id],
      comment.parcel_id,
    ),
    tone: "red",
    title: "Problème actif sur la parcelle",
    description: comment.content,
    href: parcelLookup[comment.parcel_id]
      ? `/parcels/${encodeURIComponent(parcelLookup[comment.parcel_id].idu)}`
      : undefined,
  }));

  const reportAlerts = activeProblemReports.map<DashboardAlert>((report) => ({
    id: `problem-report-${report.id}`,
    parcel_id: report.parcel_id,
    parcel_label: getParcelLabel(parcelLookup[report.parcel_id], report.parcel_id),
    tone: "red",
    title: "Problème actif remonté par reporting",
    description: `${report.report_type} - ${report.summary}`,
    href: parcelLookup[report.parcel_id]
      ? `/parcels/${encodeURIComponent(parcelLookup[report.parcel_id].idu)}`
      : undefined,
  }));

  const incidentAlerts = incidents
    .filter((item) => !["resolved", "closed", "cancelled"].includes(item.status))
    .map<DashboardAlert>((item) => ({
      id: `incident-${item.id}`,
      parcel_id: item.parcel_id,
      parcel_label: getParcelLabel(parcelLookup[item.parcel_id], item.parcel_id),
      tone: item.severity ?? "red",
      title: item.title,
      description: item.description ?? "Incident ouvert",
      href: parcelLookup[item.parcel_id]
        ? `/parcels/${encodeURIComponent(parcelLookup[item.parcel_id].idu)}`
        : undefined,
    }));

  return [...commentAlerts, ...reportAlerts, ...incidentAlerts].slice(0, 10);
}

async function getInterventionsByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];

  return safeListQuery<ParcelIntervention>(
    supabase
      .from("parcel_interventions")
      .select("*")
      .in("parcel_id", parcelIds)
      .order("date", { ascending: false })
      .order("start_time", { ascending: false }),
    "parcel_interventions",
  );
}

export async function getCommentsByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];

  return safeListQuery<ParcelComment>(
    supabase
      .from("parcel_comments")
      .select("*")
      .in("parcel_id", parcelIds)
      .order("created_at", { ascending: false }),
    "parcel_comments",
  );
}

export async function getReportsByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];

  return safeListQuery<ParcelReport>(
    supabase
      .from("parcel_reports")
      .select("*")
      .in("parcel_id", parcelIds)
      .order("date", { ascending: false })
      .order("start_time", { ascending: false })
      .order("created_at", { ascending: false }),
    "parcel_reports",
  );
}

async function getActivityByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];

  return safeListQuery<ActivityLogEntry>(
    supabase
      .from("activity_log")
      .select("*")
      .in("parcel_id", parcelIds)
      .order("created_at", { ascending: false }),
    "activity_log",
  );
}

async function getTasksByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];

  return safeListQuery<ParcelTask>(
    supabase
      .from("parcel_tasks")
      .select("*")
      .in("parcel_id", parcelIds)
      .order("due_date", { ascending: true }),
    "parcel_tasks",
  );
}

async function getIncidentsByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];

  return safeListQuery<ParcelIncident>(
    supabase
      .from("parcel_incidents")
      .select("*")
      .in("parcel_id", parcelIds)
      .order("created_at", { ascending: false }),
    "parcel_incidents",
  );
}

async function getAttachmentsByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) return [];

  return safeListQuery<Attachment>(
    supabase
      .from("attachments")
      .select("*")
      .in("parcel_id", parcelIds)
      .order("created_at", { ascending: false }),
    "attachments",
  );
}

function getRecentItemsCount<T extends { created_at: string }>(items: T[]) {
  return items.filter((item) => {
    const diff = Date.now() - new Date(item.created_at).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  }).length;
}

export async function getDashboardData(
  params?: { owner?: string },
): Promise<DashboardData> {
  const parcels = await getParcels(params);
  const parcelIds = parcels.map((parcel) => parcel.parcel_id);

  const [interventions, comments, reports, activityLog, tasks, incidents] =
    await Promise.all([
      getInterventionsByParcelIds(parcelIds),
      getCommentsByParcelIds(parcelIds),
      getReportsByParcelIds(parcelIds),
      getActivityByParcelIds(parcelIds),
      getTasksByParcelIds(parcelIds),
      getIncidentsByParcelIds(parcelIds),
    ]);

  const parcelLookup = buildParcelLookup(parcels);
  const parcelSummaries = buildParcelSummaries(
    parcels,
    interventions,
    comments,
    reports,
    tasks,
    incidents,
  );
  const activeProblemComments = comments.filter(isActiveProblemComment);
  const inProgressComments = comments.filter(isActiveInProgressComment);
  const recentCompletedComments = comments.filter(isCompletedComment).slice(0, 8);
  const activeProblemReports = reports.filter(isActiveProblemReport);
  const inProgressReports = reports.filter(isActiveInProgressReport);
  const recentCompletedReports = reports.filter(isCompletedReport).slice(0, 8);

  const recentActivity =
    activityLog.length > 0
      ? mapActivityLogToFeed(activityLog, parcelLookup)
      : buildFallbackFeed({
          interventions,
          comments,
          reports,
          incidents,
          tasks,
          parcelLookup,
        });

  const recentComments = getRecentItemsCount(comments);
  const recentReports = getRecentItemsCount(reports);
  const overdueParcels = Object.values(parcelSummaries).filter(
    (summary) => summary.overdue_tasks > 0,
  ).length;
  const recentlyModifiedParcels = Object.values(parcelSummaries).filter(
    (summary) => summary.last_activity_at,
  ).length;

  return {
    parcels,
    kpis: {
      totalParcels: parcels.length,
      interventionsToday: interventions.filter(
        (item) => item.date === new Date().toISOString().slice(0, 10),
      ).length,
      recentComments,
      recentReports,
      openIncidents: incidents.filter(
        (item) => !["resolved", "closed", "cancelled"].includes(item.status),
      ).length,
      overdueParcels,
      recentlyModifiedParcels,
      parcelsWithActiveProblems: Object.values(parcelSummaries).filter(
        (summary) => summary.active_problems_total > 0,
      ).length,
      parcelsWithInProgressActions: Object.values(parcelSummaries).filter(
        (summary) => summary.active_in_progress_total > 0,
      ).length,
      actionsCompletedRecently: Object.values(parcelSummaries).reduce(
        (total, summary) => total + summary.completed_items_recently,
        0,
      ),
    },
    parcelSummaries,
    recentActivity: recentActivity.slice(0, 12),
    latestInterventions: interventions.slice(0, 6),
    latestComments: comments.slice(0, 8),
    latestReports: reports.slice(0, 8),
    activeProblemComments,
    inProgressComments,
    recentCompletedComments,
    activeProblemReports,
    inProgressReports,
    recentCompletedReports,
    alerts: buildAlerts({
      parcels,
      activeProblemComments,
      activeProblemReports,
      incidents,
    }),
  };
}

export async function getParcelOperationalSummaries(params?: { owner?: string }) {
  const parcels = await getParcels(params);
  const parcelIds = parcels.map((parcel) => parcel.parcel_id);
  const [interventions, comments, reports, tasks, incidents] = await Promise.all([
    getInterventionsByParcelIds(parcelIds),
    getCommentsByParcelIds(parcelIds),
    getReportsByParcelIds(parcelIds),
    getTasksByParcelIds(parcelIds),
    getIncidentsByParcelIds(parcelIds),
  ]);

  return buildParcelSummaries(
    parcels,
    interventions,
    comments,
    reports,
    tasks,
    incidents,
  );
}

export async function getParcelDetailData(idu: string) {
  const parcel = await getParcelByIdu(idu);

  if (!parcel) {
    return null;
  }

  const [interventions, comments, reports, activityLog, tasks, incidents, attachments] =
    await Promise.all([
      getInterventionsByParcelIds([parcel.parcel_id]),
      getCommentsByParcelIds([parcel.parcel_id]),
      getReportsByParcelIds([parcel.parcel_id]),
      getActivityByParcelIds([parcel.parcel_id]),
      getTasksByParcelIds([parcel.parcel_id]),
      getIncidentsByParcelIds([parcel.parcel_id]),
      getAttachmentsByParcelIds([parcel.parcel_id]),
    ]);

  const parcelLookup = buildParcelLookup([parcel]);
  const summary = buildParcelOperationalSummary({
    parcel,
    interventions,
    comments,
    reports,
    tasks,
    incidents,
  });

  return {
    parcel,
    summary,
    interventions,
    comments,
    activity:
      activityLog.length > 0
        ? mapActivityLogToFeed(activityLog, parcelLookup)
        : buildFallbackFeed({
            interventions,
            comments,
            reports,
            incidents,
            tasks,
            parcelLookup,
          }),
    attachments,
    reports,
    tasks,
    incidents,
    activeProblemComments: comments.filter(isActiveProblemComment),
    activeInProgressComments: comments.filter(isActiveInProgressComment),
    activeProblemReports: reports.filter(isActiveProblemReport),
    activeInProgressReports: reports.filter(isActiveInProgressReport),
  };
}

export async function getAttachmentSummary(parcelId: string) {
  return safeSingleQuery<{ total: number }>(
    supabase
      .from("attachments")
      .select("id", { count: "exact", head: true })
      .eq("parcel_id", parcelId)
      .then(({ count, error }) => ({
        data: typeof count === "number" ? { total: count } : null,
        error,
      })),
    "attachments",
  );
}
