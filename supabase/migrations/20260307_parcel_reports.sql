create table if not exists public.parcel_reports (
  id uuid primary key default gen_random_uuid(),
  parcel_id text not null references public.parcels(parcel_id) on delete cascade,
  author_name text not null,
  author_code text,
  report_type text not null,
  status text not null default 'in_progress',
  date date not null,
  start_time time,
  end_time time,
  summary text not null,
  details text,
  is_active boolean not null default false,
  closes_report_id uuid references public.parcel_reports(id) on delete set null,
  closed_at timestamptz,
  resolved_by_report_id uuid references public.parcel_reports(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parcel_reports_status_check
    check (status in ('in_progress', 'done', 'problem'))
);

create index if not exists idx_parcel_reports_parcel_id
  on public.parcel_reports(parcel_id);
create index if not exists idx_parcel_reports_date
  on public.parcel_reports(date desc);
create index if not exists idx_parcel_reports_created_at
  on public.parcel_reports(created_at desc);
create index if not exists idx_parcel_reports_status
  on public.parcel_reports(status);
create index if not exists idx_parcel_reports_active_status
  on public.parcel_reports(parcel_id, status, is_active);
create index if not exists idx_parcel_reports_closes_report_id
  on public.parcel_reports(closes_report_id);

drop trigger if exists set_parcel_reports_updated_at on public.parcel_reports;
create trigger set_parcel_reports_updated_at
before update on public.parcel_reports
for each row execute function public.set_updated_at();

alter table public.activity_log
  add column if not exists related_report_id uuid references public.parcel_reports(id) on delete set null;

alter table public.attachments
  add column if not exists report_id uuid references public.parcel_reports(id) on delete cascade;

create or replace function public.normalize_report_state()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('in_progress', 'problem')
    and new.resolved_by_report_id is null
    and new.closed_at is null then
    new.is_active = true;
  else
    new.is_active = false;
  end if;

  if new.status = 'done' then
    new.closed_at = null;
  end if;

  return new;
end;
$$;

create or replace function public.apply_report_state_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and new.closes_report_id is not null then
    update public.parcel_reports
    set
      is_active = false,
      closed_at = coalesce(new.created_at, now()),
      resolved_by_report_id = new.id,
      updated_at = now()
    where id = new.closes_report_id
      and status in ('in_progress', 'problem');
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_parcel_report_state on public.parcel_reports;
create trigger normalize_parcel_report_state
before insert or update on public.parcel_reports
for each row execute function public.normalize_report_state();

drop trigger if exists apply_parcel_report_state_transition on public.parcel_reports;
create trigger apply_parcel_report_state_transition
after insert on public.parcel_reports
for each row execute function public.apply_report_state_transition();

create or replace function public.log_report_activity()
returns trigger
language plpgsql
as $$
declare
  parcel_label text;
  target_status text;
  title_value text;
  description_value text;
  severity_value text;
begin
  select coalesce(name, idu, parcel_id)
  into parcel_label
  from public.parcels
  where parcel_id = new.parcel_id;

  if new.closes_report_id is not null then
    select status
    into target_status
    from public.parcel_reports
    where id = new.closes_report_id;
  end if;

  severity_value := case new.status
    when 'in_progress' then 'orange'
    when 'problem' then 'red'
    when 'done' then 'green'
    else 'green'
  end;

  title_value := case new.status
    when 'in_progress' then coalesce(new.author_name, 'Un opérateur') || ' a renseigné un reporting en cours sur ' || coalesce(parcel_label, new.parcel_id)
    when 'done' then coalesce(new.author_name, 'Un opérateur') || ' a clôturé un reporting sur ' || coalesce(parcel_label, new.parcel_id)
    when 'problem' then coalesce(new.author_name, 'Un opérateur') || ' a signalé un problème via reporting sur ' || coalesce(parcel_label, new.parcel_id)
    else coalesce(new.author_name, 'Un opérateur') || ' a renseigné un reporting sur ' || coalesce(parcel_label, new.parcel_id)
  end;

  description_value := trim(
    both ' ' from
    concat(
      coalesce(new.report_type, 'Action'),
      ' - ',
      coalesce(new.summary, ''),
      case
        when new.status = 'done' and target_status is not null then
          '. Clôture de ' ||
          case target_status
            when 'problem' then 'problème'
            when 'in_progress' then 'action en cours'
            else 'reporting'
          end
        else ''
      end
    )
  );

  insert into public.activity_log (
    parcel_id,
    event_type,
    title,
    description,
    actor_name,
    actor_code,
    related_report_id,
    severity,
    metadata
  )
  values (
    new.parcel_id,
    'report',
    title_value,
    description_value,
    new.author_name,
    new.author_code,
    new.id,
    severity_value,
    jsonb_build_object(
      'report_type', new.report_type,
      'report_status', new.status,
      'summary', left(new.summary, 120),
      'is_active', new.is_active,
      'closes_report_id', new.closes_report_id,
      'resolved_by_report_id', new.resolved_by_report_id
    )
  );

  return new;
end;
$$;

drop trigger if exists log_parcel_report_activity on public.parcel_reports;
create trigger log_parcel_report_activity
after insert on public.parcel_reports
for each row execute function public.log_report_activity();

alter table public.parcel_reports enable row level security;

create policy "mvp_full_access_parcel_reports"
on public.parcel_reports
for all
to anon, authenticated
using (true)
with check (true);
