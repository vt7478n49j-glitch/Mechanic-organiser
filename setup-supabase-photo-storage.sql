-- Mechanic Mate v43: private job-photo storage
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

insert into storage.buckets (id, name, public)
values ('mechanic-mate-photos', 'mechanic-mate-photos', false)
on conflict (id) do update set public = false;

alter table storage.objects enable row level security;

drop policy if exists "Mechanic Mate photo select" on storage.objects;
drop policy if exists "Mechanic Mate photo insert" on storage.objects;
drop policy if exists "Mechanic Mate photo update" on storage.objects;
drop policy if exists "Mechanic Mate photo delete" on storage.objects;

create policy "Mechanic Mate photo select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mechanic-mate-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Mechanic Mate photo insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mechanic-mate-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Mechanic Mate photo update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mechanic-mate-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'mechanic-mate-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Mechanic Mate photo delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mechanic-mate-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
