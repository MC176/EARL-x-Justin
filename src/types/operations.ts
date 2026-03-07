import type { Parcel } from "@/types/parcel";

export type ActivitySeverity = "blue" | "green" | "orange" | "red" | "slate";
export type CommentActionState =
  | "note"
  | "in_progress"
  | "done"
  | "problem";
export type ReportStatus = "in_progress" | "done" | "problem";

export type ActivityEventType =
  | "intervention"
  | "comment"
  | "report"
  | "incident"
  | "task"
  | string;

export interface ParcelIntervention {
  id: string;
  parcel_id: string;
  author_id: string | null;
  intervention_type: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  comment: string | null;
  author_name: string;
  author_code: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ParcelComment {
  id: string;
  parcel_id: string;
  author_id: string | null;
  content: string;
  author_name: string;
  author_code: string | null;
  action_state: CommentActionState;
  is_active: boolean;
  closes_comment_id: string | null;
  closed_at: string | null;
  resolved_by_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  parcel_id: string | null;
  event_type: ActivityEventType;
  title: string;
  description: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_code: string | null;
  related_intervention_id: string | null;
  related_comment_id: string | null;
  related_report_id: string | null;
  related_task_id: string | null;
  related_incident_id: string | null;
  severity: ActivitySeverity | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  parcel_id: string | null;
  intervention_id: string | null;
  comment_id: string | null;
  report_id: string | null;
  task_id: string | null;
  incident_id: string | null;
  bucket_name: string;
  storage_path: string;
  original_filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_name: string | null;
  uploaded_by_code: string | null;
  created_at: string;
}

export interface ParcelTask {
  id: string;
  parcel_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  assigned_name: string | null;
  assigned_code: string | null;
  created_by_name: string | null;
  created_by_code: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParcelReport {
  id: string;
  parcel_id: string;
  author_id: string | null;
  author_name: string;
  author_code: string | null;
  report_type: string;
  status: ReportStatus;
  date: string;
  start_time: string | null;
  end_time: string | null;
  summary: string;
  details: string | null;
  is_active: boolean;
  closes_report_id: string | null;
  closed_at: string | null;
  resolved_by_report_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParcelIncident {
  id: string;
  parcel_id: string;
  title: string;
  description: string | null;
  severity: ActivitySeverity | null;
  status: string;
  reported_by_name: string | null;
  reported_by_code: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityFeedItem {
  id: string;
  parcel_id: string | null;
  parcel_label: string;
  event_type: ActivityEventType;
  title: string;
  description: string | null;
  actor_name: string | null;
  actor_code: string | null;
  severity: ActivitySeverity;
  state_label?: string;
  created_at: string;
  href?: string;
}

export interface ParcelOperationalSummary {
  parcel_id: string;
  tone: ActivitySeverity;
  label: string;
  description: string;
  open_incidents: number;
  overdue_tasks: number;
  pending_tasks: number;
  active_problem_comments: number;
  active_in_progress_comments: number;
  completed_comments_recently: number;
  active_problem_reports: number;
  active_in_progress_reports: number;
  completed_reports_recently: number;
  active_problems_total: number;
  active_in_progress_total: number;
  completed_items_recently: number;
  recent_comments: number;
  recent_reports: number;
  has_intervention_today: boolean;
  last_intervention_at: string | null;
  last_comment_at: string | null;
  last_report_at: string | null;
  last_activity_at: string | null;
}

export interface DashboardKpis {
  totalParcels: number;
  interventionsToday: number;
  recentComments: number;
  recentReports: number;
  openIncidents: number;
  overdueParcels: number;
  recentlyModifiedParcels: number;
  parcelsWithActiveProblems: number;
  parcelsWithInProgressActions: number;
  actionsCompletedRecently: number;
}

export interface DashboardAlert {
  id: string;
  parcel_id: string | null;
  parcel_label: string;
  tone: ActivitySeverity;
  title: string;
  description: string;
  href?: string;
}

export interface DashboardData {
  parcels: Parcel[];
  kpis: DashboardKpis;
  parcelSummaries: Record<string, ParcelOperationalSummary>;
  recentActivity: ActivityFeedItem[];
  latestInterventions: ParcelIntervention[];
  latestComments: ParcelComment[];
  latestReports: ParcelReport[];
  activeProblemComments: ParcelComment[];
  inProgressComments: ParcelComment[];
  recentCompletedComments: ParcelComment[];
  activeProblemReports: ParcelReport[];
  inProgressReports: ParcelReport[];
  recentCompletedReports: ParcelReport[];
  alerts: DashboardAlert[];
}

export const INTERVENTION_TYPE_OPTIONS = [
  "Désherbage",
  "Traitement",
  "Taille",
  "Palissage",
  "Ébourgeonnage",
  "Rognage",
  "Irrigation",
  "Vendanges",
  "Observation terrain",
  "Autre",
] as const;

export const COMMENT_ACTION_STATE_OPTIONS: Array<{
  value: CommentActionState;
  label: string;
  description: string;
}> = [
  {
    value: "note",
    label: "Commentaire simple",
    description: "Information libre sans impact persistant sur le statut.",
  },
  {
    value: "in_progress",
    label: "En cours",
    description: "Action démarrée, parcelle à suivre jusqu'à clôture.",
  },
  {
    value: "done",
    label: "Terminé",
    description: "Clôture explicite d'une action ou d'un problème actif.",
  },
  {
    value: "problem",
    label: "Signaler un problème",
    description: "Problème actif qui bloque ou nécessite une vigilance forte.",
  },
] as const;

export const REPORT_TYPE_OPTIONS = [
  "Désherbage",
  "Traitement",
  "Taille",
  "Observation terrain",
  "Entretien",
  "Contrôle",
  "Réparation",
  "Suivi sanitaire",
  "Vendanges",
  "Autre",
] as const;

export const REPORT_STATUS_OPTIONS: Array<{
  value: ReportStatus;
  label: string;
  description: string;
}> = [
  {
    value: "in_progress",
    label: "En cours",
    description: "Compte-rendu d'une action démarrée et encore active.",
  },
  {
    value: "done",
    label: "Terminé",
    description: "Compte-rendu d'une action clôturée explicitement.",
  },
  {
    value: "problem",
    label: "Signaler un problème",
    description: "Compte-rendu faisant remonter un problème actif.",
  },
] as const;
