-- Rack & Recall sync table. Paste all of this into Supabase: SQL Editor > New query > Run.
-- Safe to run more than once.

create sequence if not exists public.rack_seq;

create table if not exists public.rack_items (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind    text not null,            -- c card, n note, m settings/decks, l review log (one row per device per day)
  key     text not null,
  val     text,
  mt      bigint not null,          -- when the change was made, in ms; the newest change wins
  deleted boolean not null default false,
  seq     bigint not null default nextval('public.rack_seq'),  -- server order of changes, used to pull only what's new
  primary key (user_id, kind, key)
);

create index if not exists rack_items_user_seq on public.rack_items (user_id, seq);

-- Each person can only see and change their own rows.
alter table public.rack_items enable row level security;
drop policy if exists "own rows" on public.rack_items;
create policy "own rows" on public.rack_items
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Ignore changes older than what is stored; stamp accepted changes with a new seq.
create or replace function public.rack_touch() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.mt <= old.mt then
    return old;
  end if;
  new.seq := nextval('public.rack_seq');
  return new;
end $$;

drop trigger if exists rack_touch on public.rack_items;
create trigger rack_touch before insert or update on public.rack_items
  for each row execute function public.rack_touch();

grant usage, select on sequence public.rack_seq to authenticated;
grant select, insert, update, delete on public.rack_items to authenticated;
