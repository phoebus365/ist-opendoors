-- Open Doors — schema
-- Project: ist-opendoors (unvrlyfqxdlevokxqstp), ap-northeast-1
-- Already run 2026-10-02. Safe to re-run.

-- ============================================================ TABLES

create table if not exists opendoors_entries (
  id          uuid primary key default gen_random_uuid(),
  division    text not null check (division in ('Elementary','Secondary')),
  date_str    date not null,
  period_key  text not null,
  host_email  text not null,
  host_name   text not null,
  subject     text not null,
  grade       text,
  room        text,
  strategies  jsonb not null default '[]'::jsonb,
  note        text,                      -- what's happening in this particular class
  attachment  text,                      -- storage path, nullable
  created_at  timestamptz not null default now()
);

create table if not exists opendoors_visits (
  id            uuid primary key default gen_random_uuid(),
  entry_id      uuid not null references opendoors_entries(id) on delete cascade,
  visitor_email text not null,
  visitor_name  text not null,
  status        text not null default 'going' check (status in ('going','cancelled')),
  cancel_reason text,
  cancel_note   text,
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (entry_id, visitor_email)
);

create index if not exists opendoors_entries_lookup
  on opendoors_entries (division, date_str, period_key);
create index if not exists opendoors_visits_entry
  on opendoors_visits (entry_id) where status = 'going';

-- ============================================================ ROW LEVEL SECURITY

alter table opendoors_entries enable row level security;
alter table opendoors_visits  enable row level security;

-- Everyone signed in sees the whole board. That's the point of it.
drop policy if exists od_entries_read on opendoors_entries;
create policy od_entries_read on opendoors_entries
  for select to authenticated using (true);

-- You can only post a class under your own email.
drop policy if exists od_entries_insert on opendoors_entries;
create policy od_entries_insert on opendoors_entries
  for insert to authenticated
  with check (host_email = auth.jwt() ->> 'email');

drop policy if exists od_entries_update on opendoors_entries;
create policy od_entries_update on opendoors_entries
  for update to authenticated
  using (host_email = auth.jwt() ->> 'email');

drop policy if exists od_entries_delete on opendoors_entries;
create policy od_entries_delete on opendoors_entries
  for delete to authenticated
  using (host_email = auth.jwt() ->> 'email');

-- Visits visible to everyone signed in.
drop policy if exists od_visits_read on opendoors_visits;
create policy od_visits_read on opendoors_visits
  for select to authenticated using (true);

-- You can only sign yourself up.
drop policy if exists od_visits_insert on opendoors_visits;
create policy od_visits_insert on opendoors_visits
  for insert to authenticated
  with check (visitor_email = auth.jwt() ->> 'email');

-- You can cancel or re-join your own visit.
drop policy if exists od_visits_update on opendoors_visits;
create policy od_visits_update on opendoors_visits
  for update to authenticated
  using (visitor_email = auth.jwt() ->> 'email');

drop policy if exists od_visits_delete on opendoors_visits;
create policy od_visits_delete on opendoors_visits
  for delete to authenticated
  using (
    visitor_email = auth.jwt() ->> 'email'
    or exists (
      select 1 from opendoors_entries e
      where e.id = opendoors_visits.entry_id
        and e.host_email = auth.jwt() ->> 'email'
    )
  );

-- ============================================================ ATTACHMENTS

insert into storage.buckets (id, name, public)
values ('opendoors-files', 'opendoors-files', true)
on conflict (id) do nothing;

drop policy if exists od_files_read on storage.objects;
create policy od_files_read on storage.objects
  for select to authenticated
  using (bucket_id = 'opendoors-files');

drop policy if exists od_files_upload on storage.objects;
create policy od_files_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'opendoors-files');

drop policy if exists od_files_delete on storage.objects;
create policy od_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'opendoors-files' and owner = auth.uid());

-- ============================================================ REPORTING VIEW

drop view if exists opendoors_board;
create view opendoors_board as
select
  e.*,
  coalesce(v.n, 0) as visitor_count
from opendoors_entries e
left join (
  select entry_id, count(*) as n
  from opendoors_visits
  where status = 'going'
  group by entry_id
) v on v.entry_id = e.id;
