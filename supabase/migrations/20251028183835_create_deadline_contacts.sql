create table deadline_contacts (
  id text not null primary key default generate_prefixed_id('dc_'),
  deadline_id text references deadlines(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  contact_name text,
  email text,
  username text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table deadline_contacts enable row level security;

create policy "Users can view own deadline contacts." on deadline_contacts
  for select using ((select auth.uid()) = user_id);

create policy "Users can insert own deadline contacts." on deadline_contacts
  for insert with check ((select auth.uid()) = user_id);

create policy "Users can update own deadline contacts." on deadline_contacts
  for update using ((select auth.uid()) = user_id);

create policy "Users can delete own deadline contacts." on deadline_contacts
  for delete using ((select auth.uid()) = user_id);

CREATE TRIGGER handle_times
    BEFORE INSERT OR UPDATE ON deadline_contacts
    FOR EACH ROW
EXECUTE PROCEDURE handle_times();

create index deadline_contacts_deadline_id_idx on deadline_contacts (deadline_id);
create index deadline_contacts_user_id_idx on deadline_contacts (user_id);
