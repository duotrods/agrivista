-- AgriVista Phase 0 storage: 'media' bucket for field photos.
-- Run this in the Supabase SQL Editor after 0001_phase0_schema.sql.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public can view media" on storage.objects
  for select using (bucket_id = 'media');

create policy "Authenticated users can upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');
