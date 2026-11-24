# AgriVista data dictionary

Describes every table and column in the Supabase (PostgreSQL) database, built from the migrations in `supabase/migrations/` (0001 to 0025). See [erd.md](erd.md) for the relationships.

**Key:** PK = primary key, FK = foreign key, UK = unique. **Null?** says whether the column may be empty.

## Tables at a glance

| Table | Purpose |
|---|---|
| [profiles](#profiles) | One row per user account (farmer, LGU staff or admin). Created automatically when someone signs up through Supabase Auth. |
| [rice_fields](#rice_fields) | A registered rice field with its location, details, crop status and LGU review state. The main record of the system. |
| [field_media](#field_media) | Photos, 360° panoramas, drone photos and videos uploaded for a field. The files live in Supabase Storage; this table holds the links. |
| [field_status_logs](#field_status_logs) | History of crop-status changes for a field. |
| [field_notes](#field_notes) | Notes or remarks written on a field, optionally private to the author. |
| [field_reports](#field_reports) | Monitoring reports that farmers send to the LGU for review. |
| [crop_cycles](#crop_cycles) | A planting season for a field, from planting to harvest. |
| [crop_observations](#crop_observations) | Periodic observations of how a crop cycle is growing. |
| [notifications](#notifications) | In-app notifications shown to a user. |
| [announcements](#announcements) | Messages the LGU broadcasts to farmers. |
| [activity_logs](#activity_logs) | Audit trail of what users do in the system. |
| [system_settings](#system_settings) | Key-value system settings. Currently not used by the app. |

## profiles

One row per user account (farmer, LGU staff or admin). Created automatically when someone signs up through Supabase Auth.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK, FK | No | — | Same as the Supabase Auth user id. References auth.users(id); deleted with the user (cascade). |
| `email` | text | UK | No | — | Login email address. Must be unique. |
| `full_name` | text |  | Yes | — | The person's full name. |
| `role` | text |  | No | `'farmer'` | Account type. Allowed: farmer, lgu_staff, admin. |
| `barangay` | text |  | Yes | `'Caganganan'` | Barangay of the user. Fixed to Caganganan for new accounts. |
| `purok` | text |  | Yes | — | Sub-location (purok). Allowed: Purok Malinawon, Purok Malipayon, Purok San Francisco, Purok Anahaw, Purok Rose Mabuhay, Purok Liko Liko, Purok Awa-aw. |
| `is_active` | boolean |  | No | `true` | False means the account is disabled. New LGU staff accounts start disabled until approved. |
| `created_at` | timestamptz |  | No | `now()` | When the account was created. |

## rice_fields

A registered rice field with its location, details, crop status and LGU review state. The main record of the system.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique field id. |
| `farmer_id` | uuid | FK | No | — | Owner of the record. References profiles(id); the field is deleted with its farmer (cascade). |
| `field_name` | text |  | No | — | Name the farmer gave the field. |
| `latitude` | decimal(10,8) |  | No | — | GPS latitude of the field. |
| `longitude` | decimal(11,8) |  | No | — | GPS longitude of the field. |
| `barangay` | text |  | Yes | `'Caganganan'` | Barangay of the field. |
| `purok` | text |  | Yes | — | Purok where the field is. Allowed: Purok Malinawon, Purok Malipayon, Purok San Francisco, Purok Anahaw, Purok Rose Mabuhay, Purok Liko Liko, Purok Awa-aw. |
| `owner_name` | text |  | Yes | — | Name of the land owner. |
| `maintainer_name` | text |  | Yes | — | Name of the person who maintains the field. |
| `area_hectares` | decimal(6,2) |  | Yes | — | Field area in hectares. Recalculated when a boundary is saved. |
| `seed_type` | text |  | Yes | — | Seed type. Allowed: inbred, hybrid. |
| `crop_variety` | text |  | Yes | — | Rice variety planted. |
| `soil_type` | text |  | Yes | — | Soil type of the field. |
| `irrigation_type` | text |  | Yes | — | How the field is irrigated. |
| `planting_date` | date |  | Yes | — | Date the crop was planted. |
| `expected_harvest` | date |  | Yes | — | Estimated harvest date. |
| `polygon_coords` | jsonb |  | Yes | — | Boundary of the field as a list of map points. |
| `field_status` | text |  | No | `'fallow'` | Current crop stage. Allowed: fallow, land_prep, planted, growing, harvested. |
| `is_verified` | boolean |  | No | `false` | True once LGU staff approve the field. Only approved fields appear in public data. Set by the server, not by the app. |
| `verified_by` | uuid | FK | Yes | — | LGU staff member who approved the field. References profiles(id); cleared if that user is deleted. |
| `verified_at` | timestamptz |  | Yes | — | When the field was approved. |
| `review_status` | text |  | No | `'pending'` | Outcome of the LGU review while not approved. Allowed: pending, needs_correction, rejected. |
| `review_note` | text |  | Yes | — | LGU explanation for a rejection or correction request. Required for those outcomes. |
| `updated_at` | timestamptz |  | No | `now()` | Last change. Set by the server and used to stop approval of an out-of-date version. |
| `created_at` | timestamptz |  | No | `now()` | When the field was registered. |

## field_media

Photos, 360° panoramas, drone photos and videos uploaded for a field. The files live in Supabase Storage; this table holds the links.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique media id. |
| `field_id` | uuid | FK | No | — | Field the file belongs to. References rice_fields(id); deleted with the field. |
| `file_url` | text |  | No | — | Public URL of the file in storage. |
| `uploaded_by` | uuid | FK | Yes | — | Who uploaded it. References profiles(id); cleared if that user is deleted. |
| `media_type` | text |  | No | `'photo'` | Allowed: photo, panorama_360, video, drone_photo. |
| `caption` | text |  | Yes | — | Optional caption. |
| `field_condition` | text |  | Yes | — | Condition shown in a 360° panorama. Allowed: unplanted, planted, growth_status, ready_to_harvest. |
| `created_at` | timestamptz |  | No | `now()` | When it was uploaded. |

## field_status_logs

History of crop-status changes for a field.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique log id. |
| `field_id` | uuid | FK | No | — | Field that changed. References rice_fields(id); deleted with the field. |
| `changed_by` | uuid | FK | Yes | — | Who made the change. References profiles(id); cleared if that user is deleted. |
| `old_status` | text |  | Yes | — | Status before the change. |
| `new_status` | text |  | No | — | Status after the change. |
| `remarks` | text |  | Yes | — | The observation the user gave for the change. |
| `created_at` | timestamptz |  | No | `now()` | When the status changed. |

## field_notes

Notes or remarks written on a field, optionally private to the author.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique note id. |
| `field_id` | uuid | FK | No | — | Field the note is about. References rice_fields(id); deleted with the field. |
| `author_id` | uuid | FK | Yes | — | Who wrote it. References profiles(id); cleared if that user is deleted. |
| `content` | text |  | No | — | The note text. |
| `is_private` | boolean |  | No | `false` | True means only the author can see it. |
| `created_at` | timestamptz |  | No | `now()` | When it was written. |

## field_reports

Monitoring reports that farmers send to the LGU for review.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique report id. |
| `field_id` | uuid | FK | No | — | Field the report is about. References rice_fields(id); deleted with the field. |
| `submitted_by` | uuid | FK | Yes | — | Farmer who sent it. References profiles(id); cleared if that user is deleted. |
| `report_date` | date |  | Yes | — | Date the report covers. |
| `crop_status` | text |  | Yes | — | Crop stage reported. Allowed: fallow, land_prep, planted, growing, harvested. |
| `field_condition` | text |  | Yes | — | Condition of the field. Allowed: healthy, pest_affected, diseased, drought_stressed. |
| `summary` | text |  | No | — | The farmer's observation. |
| `harvest_info` | text |  | Yes | — | Optional harvest information. |
| `photo_url` | text |  | Yes | — | Optional photo, stored in Supabase Storage. |
| `status` | text |  | No | `'submitted'` | Allowed: submitted, reviewed (validated by the LGU). |
| `reviewed_by` | uuid | FK | Yes | — | LGU staff member who validated it. References profiles(id); cleared if that user is deleted. |
| `reviewed_at` | timestamptz |  | Yes | — | When it was validated. |
| `created_at` | timestamptz |  | No | `now()` | When it was submitted. |

## crop_cycles

A planting season for a field, from planting to harvest.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique cycle id. |
| `field_id` | uuid | FK | No | — | Field being planted. References rice_fields(id); deleted with the field. |
| `season` | text |  | No | — | Allowed: wet, dry. |
| `year` | integer |  | No | — | Year of the season. |
| `crop_variety` | text |  | Yes | — | Variety planted in this cycle. |
| `planting_date` | date |  | No | — | Date planted. |
| `harvest_date` | date |  | Yes | — | Date harvested. |
| `yield_kg` | decimal(10,2) |  | Yes | — | Harvest yield in kilograms. |
| `status` | text |  | No | `'ongoing'` | Allowed: ongoing, completed, failed. |
| `notes` | text |  | Yes | — | Optional notes. |
| `created_at` | timestamptz |  | No | `now()` | When the cycle was started. |

## crop_observations

Periodic observations of how a crop cycle is growing.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique observation id. |
| `cycle_id` | uuid | FK | No | — | Crop cycle observed. References crop_cycles(id); deleted with the cycle. |
| `observed_by` | uuid | FK | Yes | — | Who recorded it. References profiles(id); cleared if that user is deleted. |
| `observation_date` | date |  | No | `current_date` | Date of the observation. |
| `growth_stage` | text |  | No | — | Allowed: seedling, tillering, booting, heading, ripening. |
| `health_status` | text |  | No | `'healthy'` | Allowed: healthy, pest_affected, diseased, drought_stressed. |
| `pest_type` | text |  | Yes | — | Type of pest, when pest affected. |
| `remarks` | text |  | Yes | — | Optional remarks. |
| `photo_url` | text |  | Yes | — | Optional photo. |
| `created_at` | timestamptz |  | No | `now()` | When it was recorded. |

## notifications

In-app notifications shown to a user.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique notification id. |
| `user_id` | uuid | FK | No | — | Recipient. References profiles(id); deleted with the user. |
| `title` | text |  | No | — | Short title. |
| `message` | text |  | Yes | — | Longer message. |
| `type` | text |  | No | `'info'` | Allowed: info, warning, success, reminder. |
| `is_read` | boolean |  | No | `false` | Whether the user has opened it. |
| `link` | text |  | Yes | — | In-app page the notification points to. |
| `created_at` | timestamptz |  | No | `now()` | When it was created. |

## announcements

Messages the LGU broadcasts to farmers.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique announcement id. |
| `title` | text |  | No | — | Announcement title. |
| `message` | text |  | No | — | Announcement text. |
| `target_purok` | text |  | Yes | — | Purok it is addressed to. Empty means every farmer. |
| `created_by` | uuid | FK | Yes | — | LGU staff member who sent it. References profiles(id); cleared if that user is deleted. |
| `created_at` | timestamptz |  | No | `now()` | When it was sent. |

## activity_logs

Audit trail of what users do in the system.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique log id. |
| `user_id` | uuid | FK | Yes | — | Who did it. References profiles(id); cleared if that user is deleted. |
| `action` | text |  | No | — | What happened, for example approved_field. |
| `resource_type` | text |  | Yes | — | Kind of record affected, for example field. |
| `resource_id` | uuid |  | Yes | — | Id of the record affected. |
| `details` | jsonb |  | Yes | — | Extra details about the action. |
| `created_at` | timestamptz |  | No | `now()` | When it happened. |

## system_settings

Key-value system settings. Currently not used by the app.

| Column | Data type | Key | Null? | Default | Description |
|---|---|---|---|---|---|
| `id` | uuid | PK | No | `gen_random_uuid()` | Unique setting id. |
| `key` | text | UK | No | — | Setting name. Must be unique. |
| `value` | jsonb |  | No | — | Setting value. |
| `description` | text |  | Yes | — | What the setting is for. |
| `updated_by` | uuid | FK | Yes | — | Who last changed it. References profiles(id); cleared if that user is deleted. |
| `updated_at` | timestamptz |  | No | `now()` | When it was last changed. |

## Database functions and triggers

These enforce the rules in the database itself, so they apply even if someone bypasses the app.

| Name | Type | What it does |
|---|---|---|
| `handle_new_user` | Trigger on sign-up | Creates the profiles row for every new Supabase Auth user. |
| `protect_profile_privileges` | Trigger on profiles | Stops users from changing their own role or active status. |
| `protect_field_verification` | Trigger on rice_fields | Forces new fields to start pending, stamps approval details on the server, returns a field to review when its information changes, and requires a note for rejections. |
| `notify_field_submitted` | Trigger on rice_fields | Notifies every active LGU staff member when a field is registered or needs another review. |
| `notify_report_submitted` | Trigger on field_reports | Notifies every active LGU staff member when a monitoring report is submitted. |
| `notify_lgu_staff` | Function | Inserts one notification for each active LGU staff account. |
| `create_harvest_reminders` | Function (RPC) | Creates harvest reminders for a farmer's fields due within 14 days, at most one per field every 14 days. |
| `is_lgu_staff / is_admin` | Function | Return true when the signed-in user is an active LGU staff member or an admin. Used by the security rules. |
| `get_public_field_stats` | Function (public) | Counts of approved fields by purok and crop status, with no personal data. |
| `get_public_fields` | Function (public) | Approved fields for the public map with no ids or names, and coordinates rounded to about 100 meters. |
| `admin_list_lgu_accounts` | Function (admin) | Lists LGU staff accounts for the approval page. |
| `admin_list_users / admin_delete_user` | Function (admin) | Lists every account, and permanently deletes one. |

## Other notes

- **Deleting a user:** a farmer's fields, notifications and profile are deleted with the account (cascade). Records that only mention who did something are kept and the reference is cleared (set null).
- **Storage:** uploaded files live in the Supabase Storage bucket `media`. Farmers can upload only under their own field's folder.
- **Row Level Security** is enabled on every table. Farmers see their own data, LGU staff see all fields and reports, and the public sees only anonymised approved data through the public functions.
