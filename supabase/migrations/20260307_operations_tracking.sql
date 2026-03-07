create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.parcel_interventions (
  id uuid primary key default gen_random_uuid(),
  parcel_id text not null references public.parcels(parcel_id) on delete cascade,
  intervention_type text not null,
  date date not null,
  start_time time,
  end_time time,
  comment text,
  author_name text not null,
  author_code text,
  status text not null default 'done',
  photos_count integer not null default 0 check (photos_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parcel_comments (
  id uuid primary key default gen_random_uuid(),
  parcel_id text not null references public.parcels(parcel_id) on delete cascade,
  content text not null,
  author_name text not null,
  author_code text,
  photos_count integer not null default 0 check (photos_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parcel_tasks (
  id uuid primary key default gen_random_uuid(),
  parcel_id text not null references public.parcels(parcel_id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'normal',
  status text not null default 'todo',
  assigned_name text,
  assigned_code text,
  created_by_name text,
  created_by_code text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parcel_incidents (
  id uuid primary key default gen_random_uuid(),
  parcel_id text not null references public.parcels(parcel_id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'red',
  status text not null default 'open',
  reported_by_name text,
  reported_by_code text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  parcel_id text references public.parcels(parcel_id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  actor_name text,
  actor_code text,
  related_intervention_id uuid references public.parcel_interventions(id) on delete set null,
  related_comment_id uuid references public.parcel_comments(id) on delete set null,
  related_task_id uuid references public.parcel_tasks(id) on delete set null,
  related_incident_id uuid references public.parcel_incidents(id) on delete set null,
  severity text not null default 'green',
  event_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  parcel_id text references public.parcels(parcel_id) on delete cascade,
  intervention_id uuid references public.parcel_interventions(id) on delete cascade,
  comment_id uuid references public.parcel_comments(id) on delete cascade,
  task_id uuid references public.parcel_tasks(id) on delete cascade,
  incident_id uuid references public.parcel_incidents(id) on delete cascade,
  bucket_name text not null default 'parcel-files',
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by_name text,
  uploaded_by_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_parcel_interventions_parcel_id
  on public.parcel_interventions(parcel_id);
create index if not exists idx_parcel_interventions_date
  on public.parcel_interventions(date desc);
create index if not exists idx_parcel_interventions_created_at
  on public.parcel_interventions(created_at desc);

create index if not exists idx_parcel_comments_parcel_id
  on public.parcel_comments(parcel_id);
create index if not exists idx_parcel_comments_created_at
  on public.parcel_comments(created_at desc);

create index if not exists idx_parcel_tasks_parcel_id
  on public.parcel_tasks(parcel_id);
create index if not exists idx_parcel_tasks_due_date
  on public.parcel_tasks(due_date asc);
create index if not exists idx_parcel_tasks_status
  on public.parcel_tasks(status);

create index if not exists idx_parcel_incidents_parcel_id
  on public.parcel_incidents(parcel_id);
create index if not exists idx_parcel_incidents_status
  on public.parcel_incidents(status);
create index if not exists idx_parcel_incidents_created_at
  on public.parcel_incidents(created_at desc);

create index if not exists idx_activity_log_parcel_id
  on public.activity_log(parcel_id);
create index if not exists idx_activity_log_created_at
  on public.activity_log(created_at desc);
create index if not exists idx_activity_log_event_type
  on public.activity_log(event_type);
create index if not exists idx_activity_log_severity
  on public.activity_log(severity);

create index if not exists idx_attachments_parcel_id
  on public.attachments(parcel_id);
create index if not exists idx_attachments_created_at
  on public.attachments(created_at desc);

drop trigger if exists set_parcel_interventions_updated_at on public.parcel_interventions;
create trigger set_parcel_interventions_updated_at
before update on public.parcel_interventions
for each row execute function public.set_updated_at();

drop trigger if exists set_parcel_comments_updated_at on public.parcel_comments;
create trigger set_parcel_comments_updated_at
before update on public.parcel_comments
for each row execute function public.set_updated_at();

drop trigger if exists set_parcel_tasks_updated_at on public.parcel_tasks;
create trigger set_parcel_tasks_updated_at
before update on public.parcel_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_parcel_incidents_updated_at on public.parcel_incidents;
create trigger set_parcel_incidents_updated_at
before update on public.parcel_incidents
for each row execute function public.set_updated_at();

create or replace function public.log_intervention_activity()
returns trigger
language plpgsql
as $$
declare
  parcel_label text;
begin
  select coalesce(name, idu, parcel_id)
  into parcel_label
  from public.parcels
  where parcel_id = new.parcel_id;

  insert into public.activity_log (
    parcel_id,
    event_type,
    title,
    description,
    actor_name,
    actor_code,
    related_intervention_id,
    severity,
    metadata
  )
  values (
    new.parcel_id,
    'intervention',
    coalesce(new.author_name, 'Un opérateur') || ' a enregistré ' || lower(new.intervention_type) || ' sur ' || coalesce(parcel_label, new.parcel_id),
    trim(
      both ' ' from
      concat(
        case
          when new.start_time is not null and new.end_time is not null then
            'De ' || to_char(new.start_time, 'HH24:MI') || ' à ' || to_char(new.end_time, 'HH24:MI') || '. '
          when new.start_time is not null then
            'Début à ' || to_char(new.start_time, 'HH24:MI') || '. '
          else
            ''
        end,
        coalesce(new.comment, '')
      )
    ),
    new.author_name,
    new.author_code,
    new.id,
    case when new.date = current_date then 'blue' else 'green' end,
    jsonb_build_object(
      'intervention_type', new.intervention_type,
      'status', new.status,
      'date', new.date
    )
  );

  return new;
end;
$$;

create or replace function public.log_comment_activity()
returns trigger
language plpgsql
as $$
declare
  parcel_label text;
begin
  select coalesce(name, idu, parcel_id)
  into parcel_label
  from public.parcels
  where parcel_id = new.parcel_id;

  insert into public.activity_log (
    parcel_id,
    event_type,
    title,
    description,
    actor_name,
    actor_code,
    related_comment_id,
    severity,
    metadata
  )
  values (
    new.parcel_id,
    'comment',
    coalesce(new.author_name, 'Un opérateur') || ' a ajouté un commentaire sur ' || coalesce(parcel_label, new.parcel_id),
    left(new.content, 240),
    new.author_name,
    new.author_code,
    new.id,
    'green',
    jsonb_build_object(
      'content_preview', left(new.content, 120)
    )
  );

  return new;
end;
$$;

create or replace function public.log_task_activity()
returns trigger
language plpgsql
as $$
declare
  parcel_label text;
begin
  select coalesce(name, idu, parcel_id)
  into parcel_label
  from public.parcels
  where parcel_id = new.parcel_id;

  insert into public.activity_log (
    parcel_id,
    event_type,
    title,
    description,
    actor_name,
    actor_code,
    related_task_id,
    severity,
    metadata
  )
  values (
    new.parcel_id,
    'task',
    'Tâche créée sur ' || coalesce(parcel_label, new.parcel_id),
    new.title,
    new.created_by_name,
    new.created_by_code,
    new.id,
    'orange',
    jsonb_build_object(
      'priority', new.priority,
      'status', new.status,
      'due_date', new.due_date
    )
  );

  return new;
end;
$$;

create or replace function public.log_incident_activity()
returns trigger
language plpgsql
as $$
declare
  parcel_label text;
begin
  select coalesce(name, idu, parcel_id)
  into parcel_label
  from public.parcels
  where parcel_id = new.parcel_id;

  insert into public.activity_log (
    parcel_id,
    event_type,
    title,
    description,
    actor_name,
    actor_code,
    related_incident_id,
    severity,
    metadata
  )
  values (
    new.parcel_id,
    'incident',
    'Incident signalé sur ' || coalesce(parcel_label, new.parcel_id),
    coalesce(new.title, new.description),
    new.reported_by_name,
    new.reported_by_code,
    new.id,
    coalesce(new.severity, 'red'),
    jsonb_build_object(
      'status', new.status,
      'severity', new.severity
    )
  );

  return new;
end;
$$;

drop trigger if exists log_parcel_intervention_activity on public.parcel_interventions;
create trigger log_parcel_intervention_activity
after insert on public.parcel_interventions
for each row execute function public.log_intervention_activity();

drop trigger if exists log_parcel_comment_activity on public.parcel_comments;
create trigger log_parcel_comment_activity
after insert on public.parcel_comments
for each row execute function public.log_comment_activity();

drop trigger if exists log_parcel_task_activity on public.parcel_tasks;
create trigger log_parcel_task_activity
after insert on public.parcel_tasks
for each row execute function public.log_task_activity();

drop trigger if exists log_parcel_incident_activity on public.parcel_incidents;
create trigger log_parcel_incident_activity
after insert on public.parcel_incidents
for each row execute function public.log_incident_activity();

alter table public.parcel_interventions enable row level security;
alter table public.parcel_comments enable row level security;
alter table public.parcel_tasks enable row level security;
alter table public.parcel_incidents enable row level security;
alter table public.activity_log enable row level security;
alter table public.attachments enable row level security;

create policy "mvp_full_access_parcel_interventions"
on public.parcel_interventions
for all
to anon, authenticated
using (true)
with check (true);

create policy "mvp_full_access_parcel_comments"
on public.parcel_comments
for all
to anon, authenticated
using (true)
with check (true);

create policy "mvp_full_access_parcel_tasks"
on public.parcel_tasks
for all
to anon, authenticated
using (true)
with check (true);

create policy "mvp_full_access_parcel_incidents"
on public.parcel_incidents
for all
to anon, authenticated
using (true)
with check (true);

create policy "mvp_full_access_activity_log"
on public.activity_log
for all
to anon, authenticated
using (true)
with check (true);

create policy "mvp_full_access_attachments"
on public.attachments
for all
to anon, authenticated
using (true)
with check (true);
