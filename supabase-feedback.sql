-- Imastun: song reactions + visitor feedback.
-- Run once in Supabase -> SQL Editor. Safe to run again.

-- 1) Reactions: one counter per (song, reaction). Everyone can read; only the function writes.
create table if not exists public.song_reactions (
  song_id  text    not null,
  reaction text    not null check (reaction in ('love','moved','fire','joy')),
  count    integer not null default 0,
  primary key (song_id, reaction)
);

alter table public.song_reactions enable row level security;

drop policy if exists "reactions are public" on public.song_reactions;
create policy "reactions are public" on public.song_reactions
  for select to anon, authenticated using (true);

create or replace function public.add_reaction(p_song_id text, p_reaction text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if p_reaction not in ('love','moved','fire','joy') or p_song_id is null or length(p_song_id) > 200 then
    raise exception 'invalid reaction';
  end if;
  insert into public.song_reactions (song_id, reaction, count)
  values (p_song_id, p_reaction, 1)
  on conflict (song_id, reaction)
  do update set count = public.song_reactions.count + 1
  returning count into n;
  return n;
end;
$$;

grant execute on function public.add_reaction(text, text) to anon, authenticated;

-- 2) Feedback: anyone can send a message, nobody can read them through the site.
--    You read them in Supabase -> Table Editor -> feedback.
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  message    text not null check (char_length(message) between 3 and 1500),
  contact    text check (contact is null or char_length(contact) <= 200),
  page       text,
  lang       text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

drop policy if exists "anyone can send feedback" on public.feedback;
create policy "anyone can send feedback" on public.feedback
  for insert to anon, authenticated with check (true);
