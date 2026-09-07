-- AgriVista Phase 2: media types (photo / 360 panorama / video) + captions.
-- Run this in the Supabase SQL Editor after 0001-0003.

alter table field_media
  add column if not exists uploaded_by uuid references profiles (id),
  add column if not exists media_type text not null default 'photo',
  add column if not exists caption text;

alter table field_media
  drop constraint if exists field_media_media_type_check;
alter table field_media
  add constraint field_media_media_type_check
  check (media_type in ('photo', 'panorama_360', 'video'));
