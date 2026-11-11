-- Migration: create_votes
-- הצבעות "אהבתי" ו"לא אהבתי". קול אחד לכל משתמש לכל בדיחה (המפתח הראשי).
-- הטבלה נעולה: RLS בלי policy, וגישה רק ל-service_role.
-- העמודה laughs והפונקציה add_laugh מ-Milestone 4 נשארות. לא מוחקים נתונים.

create table public.votes (
  user_id  uuid        not null references auth.users (id)   on delete cascade,
  joke_id  uuid        not null references public.jokes (id) on delete cascade,
  value    smallint    not null check (value in (-1, 1)),
  voted_at timestamptz not null default now(),
  primary key (user_id, joke_id)
);

create index votes_joke_id_idx on public.votes (joke_id);

alter table public.votes enable row level security;
revoke all on public.votes from anon, authenticated;
grant select, insert, update, delete on public.votes to service_role;

-- cast_vote: 1 או -1 מוסיפה או מחליפה הצבעה. 0 מוחקת. כל ערך אחר: שגיאה.
-- בדיחה שלא קיימת: שגיאה P0002 (ה-API מתרגם ל-404).
-- מחזירה שורה אחת: likes, dislikes, my_vote של הבדיחה.
create function public.cast_vote(voter uuid, target uuid, new_value smallint)
returns table (likes integer, dislikes integer, my_vote smallint)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new_value is null or new_value not in (-1, 0, 1) then
    raise exception 'invalid vote value' using errcode = '22023';
  end if;

  if not exists (select 1 from public.jokes j where j.id = target) then
    raise exception 'joke not found' using errcode = 'P0002';
  end if;

  if new_value = 0 then
    delete from public.votes v where v.user_id = voter and v.joke_id = target;
  else
    insert into public.votes as v (user_id, joke_id, value, voted_at)
    values (voter, target, new_value, now())
    on conflict (user_id, joke_id)
    do update set value = excluded.value, voted_at = excluded.voted_at;
  end if;

  return query
    select
      (count(*) filter (where v.value = 1))::integer,
      (count(*) filter (where v.value = -1))::integer,
      (select m.value from public.votes m where m.user_id = voter and m.joke_id = target)
    from public.votes v
    where v.joke_id = target;
end;
$$;

-- joke_feed: שלושה מצבים. viewer הוא null לאורח. max_rows מוגבל ל-1 עד 50.
--   new   לפי created_at מהחדש
--   top   רק בדיחות עם like אחד לפחות, לפי likes פחות dislikes, ואז לפי likes
--   liked רק בדיחות ש-viewer סימן בהן 1, לפי voted_at מהחדש
create function public.joke_feed(viewer uuid, mode text, max_rows integer default 20)
returns table (
  id          uuid,
  created_at  timestamptz,
  topic       text,
  text        text,
  author_name text,
  likes       integer,
  dislikes    integer,
  my_vote     smallint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    j.id,
    j.created_at,
    j.topic,
    j.text,
    j.author_name,
    c.likes,
    c.dislikes,
    mv.value as my_vote
  from public.jokes j
  cross join lateral (
    select
      (count(*) filter (where v.value = 1))::integer  as likes,
      (count(*) filter (where v.value = -1))::integer as dislikes
    from public.votes v
    where v.joke_id = j.id
  ) c
  left join public.votes mv on mv.joke_id = j.id and mv.user_id = viewer
  where case joke_feed.mode
          when 'new'   then true
          when 'top'   then c.likes >= 1
          when 'liked' then mv.value = 1
          else false
        end
  order by
    case when joke_feed.mode = 'top' then c.likes - c.dislikes end desc nulls last,
    case when joke_feed.mode = 'top' then c.likes end desc nulls last,
    case when joke_feed.mode = 'liked' then mv.voted_at end desc nulls last,
    j.created_at desc
  limit least(greatest(coalesce(max_rows, 20), 1), 50);
$$;

revoke execute on function public.cast_vote(uuid, uuid, smallint) from public, anon, authenticated;
grant  execute on function public.cast_vote(uuid, uuid, smallint) to service_role;

revoke execute on function public.joke_feed(uuid, text, integer) from public, anon, authenticated;
grant  execute on function public.joke_feed(uuid, text, integer) to service_role;
