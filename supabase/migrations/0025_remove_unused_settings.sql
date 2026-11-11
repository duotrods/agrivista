-- These settings were never read by the app, so remove them from system_settings.
delete from public.system_settings
where key in ('max_upload_mb', 'map_default_center');
