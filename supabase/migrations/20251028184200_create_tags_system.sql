create table tags (
  id text not null primary key default generate_prefixed_id('tg_'),
  name text not null,
  color text not null,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(name, user_id)
);

alter table tags enable row level security;

create policy "Users can view all system tags and own tags." on tags
  for select using (user_id is null or (select auth.uid()) = user_id);

create policy "Users can insert own tags." on tags
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own tags." on tags
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete own tags." on tags
  for delete using ((select auth.uid()) = user_id);

CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON tags
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

create index tags_user_id_idx on tags (user_id);
create index tags_name_idx on tags (name);

create table deadline_tags (
  id text not null primary key default generate_prefixed_id('dtg_'),
  deadline_id text references deadlines(id) on delete cascade not null,
  tag_id text references tags(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(deadline_id, tag_id)
);

alter table deadline_tags enable row level security;

create policy "Users can view own deadline tags." on deadline_tags
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert own deadline tags." on deadline_tags
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own deadline tags." on deadline_tags
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete own deadline tags." on deadline_tags
  for delete using ((select auth.uid()) = user_id);

CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON deadline_tags
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

create index deadline_tags_deadline_id_idx on deadline_tags (deadline_id);
create index deadline_tags_tag_id_idx on deadline_tags (tag_id);
create index deadline_tags_user_id_idx on deadline_tags (user_id);
