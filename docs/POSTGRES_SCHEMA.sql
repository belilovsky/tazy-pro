-- TAZY.DOG MVP schema draft.
-- Intended as a baseline for the first FastAPI + Postgres backend.

create extension if not exists pgcrypto;

create table owners (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  legal_name text,
  country text not null default 'KZ',
  region text,
  contact_email text,
  contact_phone text,
  public_contact_allowed boolean not null default false,
  consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table breeders (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  legal_name text,
  country text not null default 'KZ',
  region text,
  verification_status text not null default 'draft',
  public_profile_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint breeders_verification_status_check
    check (verification_status in ('draft', 'pending', 'verified', 'suspended'))
);

create table kennels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  registration_number text unique,
  country text not null default 'KZ',
  region text,
  owner_id uuid references owners(id),
  verification_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kennels_verification_status_check
    check (verification_status in ('draft', 'pending', 'verified', 'suspended'))
);

create table dogs (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  registry_number text not null unique,
  passport_id text not null unique,
  name text not null,
  sex text not null,
  date_of_birth date,
  color text,
  region text,
  status text not null default 'draft',
  public_profile_slug text unique,
  verification_level integer not null default 1,
  completeness_score integer not null default 0,
  owner_id uuid references owners(id),
  breeder_id uuid references breeders(id),
  kennel_id uuid references kennels(id),
  summary text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dogs_sex_check check (sex in ('male', 'female')),
  constraint dogs_status_check check (status in ('draft', 'active', 'archived', 'deceased')),
  constraint dogs_verification_level_check check (verification_level between 1 and 8),
  constraint dogs_completeness_score_check check (completeness_score between 0 and 100)
);

create table pedigree_links (
  id uuid primary key default gen_random_uuid(),
  child_dog_id uuid not null references dogs(id) on delete cascade,
  parent_dog_id uuid references dogs(id),
  parent_role text not null,
  source text,
  verification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint pedigree_links_parent_role_check check (parent_role in ('sire', 'dam')),
  constraint pedigree_links_verification_status_check
    check (verification_status in ('pending', 'approved', 'rejected')),
  constraint pedigree_links_unique_role unique (child_dog_id, parent_role)
);

create table evidence_items (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  dog_id uuid not null references dogs(id) on delete cascade,
  type text not null,
  title text not null,
  issuer text,
  issued_at date,
  submitted_by text,
  received_at date,
  file_id text,
  source_url text,
  hash text,
  priority text not null default 'medium',
  visibility text not null default 'reviewer_only',
  status text not null default 'needs_review',
  summary text,
  reviewer_note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint evidence_items_type_check
    check (type in ('ownership', 'microchip', 'pedigree', 'health', 'dna', 'field_trial', 'fci_export', 'show_result', 'photo', 'other')),
  constraint evidence_items_priority_check check (priority in ('low', 'medium', 'high')),
  constraint evidence_items_visibility_check check (visibility in ('public', 'private', 'reviewer_only')),
  constraint evidence_items_status_check
    check (status in ('approved', 'pending', 'needs_review', 'waiting_external', 'rejected'))
);

create table verification_decisions (
  id uuid primary key default gen_random_uuid(),
  evidence_item_id uuid not null references evidence_items(id) on delete cascade,
  reviewer_id uuid,
  decision text not null,
  note text not null,
  created_at timestamptz not null default now(),
  constraint verification_decisions_decision_check
    check (decision in ('approved', 'changes_requested', 'rejected', 'superseded'))
);

create table passport_events (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  dog_id uuid not null references dogs(id) on delete cascade,
  event_type text not null,
  title text not null,
  value text not null,
  event_at timestamptz not null,
  visibility text not null default 'public',
  evidence_item_id uuid references evidence_items(id),
  hash text,
  created_at timestamptz not null default now(),
  constraint passport_events_visibility_check check (visibility in ('public', 'private', 'reviewer_only'))
);

create table health_tests (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  test_type text not null,
  result text not null,
  tested_at date,
  issuer text,
  evidence_item_id uuid references evidence_items(id),
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  constraint health_tests_visibility_check check (visibility in ('public', 'private', 'reviewer_only'))
);

create table dna_profiles (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  lab text,
  sample_id text,
  parentage_verified boolean not null default false,
  genetic_markers_summary text,
  evidence_item_id uuid references evidence_items(id),
  created_at timestamptz not null default now()
);

create table field_trials (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references dogs(id) on delete cascade,
  event_name text not null,
  event_date date,
  location text,
  result text,
  video_evidence_item_id uuid references evidence_items(id),
  judge_notes text,
  created_at timestamptz not null default now()
);

create table export_packages (
  id uuid primary key default gen_random_uuid(),
  package_key text not null unique,
  name text not null,
  format text not null,
  status text not null default 'draft',
  artifact_url text,
  artifact_hash text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint export_packages_status_check check (status in ('draft', 'ready', 'exported', 'failed'))
);

create index dogs_public_id_idx on dogs(public_id);
create index dogs_passport_id_idx on dogs(passport_id);
create index dogs_registry_number_idx on dogs(registry_number);
create index evidence_items_dog_status_idx on evidence_items(dog_id, status);
create index evidence_items_priority_idx on evidence_items(priority, status);
create index verification_decisions_evidence_created_idx on verification_decisions(evidence_item_id, created_at desc);
create index passport_events_dog_event_at_idx on passport_events(dog_id, event_at desc);
