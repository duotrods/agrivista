-- Adds a distinct 'drone_photo' media type for aerial/drone field shots,
-- so they can be labeled and shown differently from ground-level photos.

alter table field_media
  drop constraint if exists field_media_media_type_check;
alter table field_media
  add constraint field_media_media_type_check
  check (media_type in ('photo', 'panorama_360', 'video', 'drone_photo'));
