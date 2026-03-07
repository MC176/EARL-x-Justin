create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  display_name text not null,
  role text not null default 'operator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    first_name,
    display_name,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'operator')
  )
  on conflict (id) do update
  set
    first_name = excluded.first_name,
    display_name = excluded.display_name,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

alter table public.parcel_comments
  add column if not exists author_id uuid references auth.users(id) on delete set null;

alter table public.parcel_interventions
  add column if not exists author_id uuid references auth.users(id) on delete set null;

alter table public.parcel_reports
  add column if not exists author_id uuid references auth.users(id) on delete set null;

alter table public.activity_log
  add column if not exists actor_id uuid references auth.users(id) on delete set null;

create index if not exists idx_parcel_comments_author_id
  on public.parcel_comments(author_id);
create index if not exists idx_parcel_interventions_author_id
  on public.parcel_interventions(author_id);
create index if not exists idx_parcel_reports_author_id
  on public.parcel_reports(author_id);
create index if not exists idx_activity_log_actor_id
  on public.activity_log(actor_id);

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
    actor_id,
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
    new.author_id,
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
  target_state text;
  action_label text;
  title_value text;
  description_value text;
  severity_value text;
begin
  select coalesce(name, idu, parcel_id)
  into parcel_label
  from public.parcels
  where parcel_id = new.parcel_id;

  if new.closes_comment_id is not null then
    select action_state
    into target_state
    from public.parcel_comments
    where id = new.closes_comment_id;
  end if;

  action_label := case new.action_state
    when 'in_progress' then 'En cours'
    when 'done' then 'Terminé'
    when 'problem' then 'Problème'
    else 'Commentaire'
  end;

  severity_value := case new.action_state
    when 'in_progress' then 'orange'
    when 'problem' then 'red'
    when 'done' then 'green'
    else 'green'
  end;

  title_value := case new.action_state
    when 'in_progress' then coalesce(new.author_name, 'Un opérateur') || ' a mis une action en cours sur ' || coalesce(parcel_label, new.parcel_id)
    when 'done' then coalesce(new.author_name, 'Un opérateur') || ' a marqué un élément comme terminé sur ' || coalesce(parcel_label, new.parcel_id)
    when 'problem' then coalesce(new.author_name, 'Un opérateur') || ' a signalé un problème sur ' || coalesce(parcel_label, new.parcel_id)
    else coalesce(new.author_name, 'Un opérateur') || ' a ajouté un commentaire sur ' || coalesce(parcel_label, new.parcel_id)
  end;

  description_value := trim(
    both ' ' from
    concat(
      case
        when new.action_state = 'done' and target_state is not null then
          'Clôture de ' ||
          case target_state
            when 'problem' then 'problème'
            when 'in_progress' then 'action en cours'
            else 'commentaire'
          end ||
          '. '
        else ''
      end,
      left(new.content, 240)
    )
  );

  insert into public.activity_log (
    parcel_id,
    event_type,
    title,
    description,
    actor_id,
    actor_name,
    actor_code,
    related_comment_id,
    severity,
    metadata
  )
  values (
    new.parcel_id,
    'comment',
    title_value,
    description_value,
    new.author_id,
    new.author_name,
    new.author_code,
    new.id,
    severity_value,
    jsonb_build_object(
      'action_state', new.action_state,
      'action_label', action_label,
      'is_active', new.is_active,
      'closes_comment_id', new.closes_comment_id,
      'resolved_by_comment_id', new.resolved_by_comment_id,
      'content_preview', left(new.content, 120)
    )
  );

  return new;
end;
$$;

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
    actor_id,
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
    new.author_id,
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

alter table public.profiles enable row level security;

drop policy if exists "mvp_full_access_parcel_comments" on public.parcel_comments;
drop policy if exists "mvp_full_access_parcel_interventions" on public.parcel_interventions;
drop policy if exists "mvp_full_access_activity_log" on public.activity_log;
drop policy if exists "mvp_full_access_parcel_reports" on public.parcel_reports;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "parcel_comments_read_app"
on public.parcel_comments
for select
to anon, authenticated
using (true);

create policy "parcel_comments_insert_own"
on public.parcel_comments
for insert
to authenticated
with check (author_id = auth.uid());

create policy "parcel_interventions_read_app"
on public.parcel_interventions
for select
to anon, authenticated
using (true);

create policy "parcel_interventions_insert_own"
on public.parcel_interventions
for insert
to authenticated
with check (author_id = auth.uid());

create policy "parcel_reports_read_app"
on public.parcel_reports
for select
to anon, authenticated
using (true);

create policy "parcel_reports_insert_own"
on public.parcel_reports
for insert
to authenticated
with check (author_id = auth.uid());

create policy "activity_log_read_app"
on public.activity_log
for select
to anon, authenticated
using (true);

create policy "activity_log_insert_authenticated_actor"
on public.activity_log
for insert
to authenticated
with check (actor_id = auth.uid());
