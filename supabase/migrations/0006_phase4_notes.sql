-- AgriVista Phase 4: field notes (comments), public or private to the author.

create table if not exists field_notes (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references rice_fields (id) on delete cascade,
  author_id uuid not null references profiles (id),
  content text not null,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

alter table field_notes enable row level security;

drop policy if exists "Farmers can view non-private notes or own notes" on field_notes;
create policy "Farmers can view non-private notes or own notes" on field_notes
  for select using (
    auth.uid() = author_id
    or (
      is_private = false
      and exists (
        select 1 from rice_fields
        where rice_fields.id = field_notes.field_id
        and rice_fields.farmer_id = auth.uid()
      )
    )
  );

drop policy if exists "Farmers can insert notes on own fields" on field_notes;
create policy "Farmers can insert notes on own fields" on field_notes
  for insert with check (
    auth.uid() = author_id
    and exists (
      select 1 from rice_fields
      where rice_fields.id = field_notes.field_id
      and rice_fields.farmer_id = auth.uid()
    )
  );
