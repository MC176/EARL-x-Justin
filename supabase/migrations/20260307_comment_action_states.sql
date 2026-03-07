alter table public.parcel_comments
  add column if not exists action_state text not null default 'note',
  add column if not exists is_active boolean not null default false,
  add column if not exists closes_comment_id uuid references public.parcel_comments(id) on delete set null,
  add column if not exists closed_at timestamptz,
  add column if not exists resolved_by_comment_id uuid references public.parcel_comments(id) on delete set null;

alter table public.parcel_comments
  drop constraint if exists parcel_comments_action_state_check;

alter table public.parcel_comments
  add constraint parcel_comments_action_state_check
  check (action_state in ('note', 'in_progress', 'done', 'problem'));

update public.parcel_comments
set
  action_state = coalesce(action_state, 'note'),
  is_active = case
    when action_state in ('in_progress', 'problem') and resolved_by_comment_id is null and closed_at is null then true
    else false
  end
where true;

create index if not exists idx_parcel_comments_action_state
  on public.parcel_comments(action_state);

create index if not exists idx_parcel_comments_active_state
  on public.parcel_comments(parcel_id, action_state, is_active);

create index if not exists idx_parcel_comments_closes_comment_id
  on public.parcel_comments(closes_comment_id);

create or replace function public.normalize_comment_state()
returns trigger
language plpgsql
as $$
begin
  if new.action_state in ('in_progress', 'problem')
    and new.resolved_by_comment_id is null
    and new.closed_at is null then
    new.is_active = true;
  else
    new.is_active = false;
  end if;

  if new.action_state = 'done' then
    new.closed_at = null;
  end if;

  return new;
end;
$$;

create or replace function public.apply_comment_state_transition()
returns trigger
language plpgsql
as $$
begin
  if new.action_state = 'done' and new.closes_comment_id is not null then
    update public.parcel_comments
    set
      is_active = false,
      closed_at = coalesce(new.created_at, now()),
      resolved_by_comment_id = new.id,
      updated_at = now()
    where id = new.closes_comment_id
      and action_state in ('in_progress', 'problem');
  end if;

  return new;
end;
$$;

drop trigger if exists normalize_parcel_comment_state on public.parcel_comments;
create trigger normalize_parcel_comment_state
before insert or update on public.parcel_comments
for each row execute function public.normalize_comment_state();

drop trigger if exists apply_parcel_comment_state_transition on public.parcel_comments;
create trigger apply_parcel_comment_state_transition
after insert on public.parcel_comments
for each row execute function public.apply_comment_state_transition();

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
