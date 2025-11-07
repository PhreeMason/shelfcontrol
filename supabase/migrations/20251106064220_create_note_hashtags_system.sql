create table hashtags (
  id text not null primary key default generate_prefixed_id('ht_'),
  name text not null,
  color text not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(name, user_id)
);

alter table hashtags enable row level security;

create policy "Users can view own hashtags." on hashtags
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert own hashtags." on hashtags
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own hashtags." on hashtags
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete own hashtags." on hashtags
  for delete using ((select auth.uid()) = user_id);

CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON hashtags
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

create index hashtags_user_id_idx on hashtags (user_id);
create index hashtags_name_idx on hashtags (name);

create table note_hashtags (
  id text not null primary key default generate_prefixed_id('nht_'),
  note_id text references deadline_notes(id) on delete cascade not null,
  hashtag_id text references hashtags(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(note_id, hashtag_id)
);

alter table note_hashtags enable row level security;

create policy "Users can view own note hashtags." on note_hashtags
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert own note hashtags." on note_hashtags
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own note hashtags." on note_hashtags
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete own note hashtags." on note_hashtags
  for delete using ((select auth.uid()) = user_id);

CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON note_hashtags
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

create index note_hashtags_note_id_idx on note_hashtags (note_id);
create index note_hashtags_hashtag_id_idx on note_hashtags (hashtag_id);
create index note_hashtags_user_id_idx on note_hashtags (user_id);
