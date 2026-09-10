-- Adds a field-condition tag for 360° multimedia, matching the proposal's
-- categorization: unplanted, planted, growth status, ready-to-harvest.

alter table field_media
  add column if not exists field_condition text;

alter table field_media
  drop constraint if exists field_media_field_condition_check;
alter table field_media
  add constraint field_media_field_condition_check
  check (
    field_condition is null or field_condition in (
      'unplanted', 'planted', 'growth_status', 'ready_to_harvest'
    )
  );
