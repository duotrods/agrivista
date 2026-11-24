# AgriVista database: entity-relationship diagram

Generated from the Supabase migrations in `supabase/migrations/` (0001 to 0025). PK = primary key, FK = foreign key, UK = unique.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "signs up as (id)"

    PROFILES ||--o{ RICE_FIELDS : "owns (farmer_id)"
    PROFILES |o--o{ RICE_FIELDS : "approves (verified_by)"
    PROFILES ||--o{ NOTIFICATIONS : "receives (user_id)"
    PROFILES |o--o{ ACTIVITY_LOGS : "performs (user_id)"
    PROFILES |o--o{ ANNOUNCEMENTS : "sends (created_by)"
    PROFILES |o--o{ SYSTEM_SETTINGS : "updates (updated_by)"
    PROFILES |o--o{ FIELD_MEDIA : "uploads (uploaded_by)"
    PROFILES |o--o{ FIELD_STATUS_LOGS : "changes status (changed_by)"
    PROFILES |o--o{ FIELD_NOTES : "writes (author_id)"
    PROFILES |o--o{ FIELD_REPORTS : "submits (submitted_by)"
    PROFILES |o--o{ FIELD_REPORTS : "validates (reviewed_by)"
    PROFILES |o--o{ CROP_OBSERVATIONS : "records (observed_by)"

    RICE_FIELDS ||--o{ FIELD_MEDIA : "has"
    RICE_FIELDS ||--o{ FIELD_STATUS_LOGS : "has history"
    RICE_FIELDS ||--o{ FIELD_NOTES : "has"
    RICE_FIELDS ||--o{ FIELD_REPORTS : "has"
    RICE_FIELDS ||--o{ CROP_CYCLES : "has seasons"
    CROP_CYCLES ||--o{ CROP_OBSERVATIONS : "has"

    AUTH_USERS {
        uuid id PK
    }

    PROFILES {
        uuid id PK, FK
        text email UK
        text full_name
        text role "farmer, lgu_staff, admin"
        text barangay
        text purok
        boolean is_active
        timestamptz created_at
    }

    RICE_FIELDS {
        uuid id PK
        uuid farmer_id FK
        text field_name
        decimal latitude
        decimal longitude
        text barangay
        text purok
        text owner_name
        text maintainer_name
        decimal area_hectares
        text seed_type "inbred, hybrid"
        text crop_variety
        text soil_type
        text irrigation_type
        date planting_date
        date expected_harvest
        jsonb polygon_coords
        text field_status "fallow to harvested"
        boolean is_verified
        uuid verified_by FK
        timestamptz verified_at
        text review_status "pending, needs_correction, rejected"
        text review_note
        timestamptz updated_at
        timestamptz created_at
    }

    FIELD_MEDIA {
        uuid id PK
        uuid field_id FK
        uuid uploaded_by FK
        text file_url
        text media_type "photo, panorama_360, video, drone_photo"
        text caption
        text field_condition
        timestamptz created_at
    }

    FIELD_STATUS_LOGS {
        uuid id PK
        uuid field_id FK
        uuid changed_by FK
        text old_status
        text new_status
        text remarks
        timestamptz created_at
    }

    FIELD_NOTES {
        uuid id PK
        uuid field_id FK
        uuid author_id FK
        text content
        boolean is_private
        timestamptz created_at
    }

    FIELD_REPORTS {
        uuid id PK
        uuid field_id FK
        uuid submitted_by FK
        uuid reviewed_by FK
        date report_date
        text crop_status
        text field_condition "healthy, pest_affected, diseased, drought_stressed"
        text summary
        text harvest_info
        text photo_url
        text status "submitted, reviewed"
        timestamptz reviewed_at
        timestamptz created_at
    }

    CROP_CYCLES {
        uuid id PK
        uuid field_id FK
        text season "wet, dry"
        integer year
        text crop_variety
        date planting_date
        date harvest_date
        decimal yield_kg
        text status "ongoing, completed, failed"
        text notes
        timestamptz created_at
    }

    CROP_OBSERVATIONS {
        uuid id PK
        uuid cycle_id FK
        uuid observed_by FK
        date observation_date
        text growth_stage "seedling to ripening"
        text health_status
        text pest_type
        text remarks
        text photo_url
        timestamptz created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text title
        text message
        text type "info, warning, success, reminder"
        boolean is_read
        text link
        timestamptz created_at
    }

    ANNOUNCEMENTS {
        uuid id PK
        uuid created_by FK
        text title
        text message
        text target_purok
        timestamptz created_at
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid user_id FK
        text action
        text resource_type
        uuid resource_id
        jsonb details
        timestamptz created_at
    }

    SYSTEM_SETTINGS {
        uuid id PK
        text key UK
        jsonb value
        text description
        uuid updated_by FK
        timestamptz updated_at
    }
```

## Reading the diagram

- **PROFILES** is the hub. Every person (farmer, LGU staff, admin) has one profile, created automatically when they sign up through Supabase Auth (`AUTH_USERS`).
- **RICE_FIELDS** is the main record. A farmer owns many fields, and an LGU staff member can approve a field (`verified_by`).
- A field has many media files, status changes, notes, monitoring reports and crop cycles. A crop cycle has many observations.
- **Deleting a user:** a farmer's fields, notifications and profile are deleted with the account (`on delete cascade`). Records that only mention who did something (logs, notes, reports, approvals, uploads) are kept and the reference is cleared (`on delete set null`, migration 0023).
- Lines marked with a circle (`|o`) are optional links. A circle on the "many" side (`o{`) means zero or more.
