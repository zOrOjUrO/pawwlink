-- PawLink — Supabase schema (Next.js / pgvector)
-- Run in the Supabase SQL editor. Embedding dim is 512 (CLIP ViT-B-32);
-- must match EMBEDDING_DIM in .env.local.

-- 1. Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "vector";     -- pgvector

-- 2. Enums --------------------------------------------------------------------
do $$ begin
    create type triage_severity as enum ('healthy', 'minor', 'moderate', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
    -- 'registered' = a known owner pet (matched against); others = intake lifecycle
    create type intake_status as enum ('registered', 'intake', 'matching', 'matched', 'notified', 'closed');
exception when duplicate_object then null; end $$;

-- 3. owners -------------------------------------------------------------------
create table if not exists public.owners (
    id              uuid primary key default gen_random_uuid(),
    name            text not null,
    phone           text,
    email           text,
    -- Display metadata for the owner's pets, e.g.
    -- [{ "name": "Bram", "breed": "Labrador Retriever", "species": "dog" }]
    registered_pets jsonb default '[]'::jsonb,
    created_at      timestamptz not null default now()
);

-- 4. animals ------------------------------------------------------------------
-- One row per animal. A "registered owner pet" has owner_id set and
-- status = 'registered'; a new intake has owner_id null and status = 'intake'.
create table if not exists public.animals (
    id                uuid primary key default gen_random_uuid(),

    -- Image / passport
    image_url         text,
    species           text,
    breed             text,
    breed_confidence  real,                       -- 0.0 - 1.0
    primary_color     text,
    secondary_color   text,
    pattern           text,
    distinctive_markings text,
    embedding         vector(512),                -- CLIP ViT-B-32, L2-normalized

    -- Triage
    severity          triage_severity default 'minor',
    severity_score    int default 0,              -- 0-3
    observed_injuries jsonb default '[]'::jsonb,
    urgent            boolean default false,
    triage_notes      text,

    -- Full agreed analyze() passport for completeness / future fields
    passport          jsonb,
    raw_llm_response  text,

    -- Identity / workflow
    chip_number       text,
    status            intake_status default 'intake',
    owner_id          uuid references public.owners(id) on delete set null,

    capture_timestamp timestamptz,
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

-- 5. Indexes ------------------------------------------------------------------
-- IVFFlat cosine index on the embedding (run ANALYZE after bulk loads).
create index if not exists animals_embedding_idx
    on public.animals using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists animals_status_idx on public.animals (status);
create index if not exists animals_owner_idx on public.animals (owner_id);
create index if not exists animals_chip_idx on public.animals (chip_number);

-- 6. updated_at trigger -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_animals_updated_at on public.animals;
create trigger trg_animals_updated_at
    before update on public.animals
    for each row execute function public.set_updated_at();

-- 7. Similarity search RPC ----------------------------------------------------
-- Cosine similarity against REGISTERED owner pets (owner_id is not null), so a
-- found-animal embedding surfaces candidate owners (not itself).
-- similarity = 1 - cosine_distance (higher = more similar).
create or replace function public.match_animals(
    query_embedding vector(512),
    match_threshold real default 0.75,
    match_count     int  default 5
)
returns table (
    id          uuid,
    species     text,
    breed       text,
    severity    triage_severity,
    image_url   text,
    owner_id    uuid,
    similarity  real
)
language sql stable
as $$
    select
        a.id, a.species, a.breed, a.severity, a.image_url, a.owner_id,
        1 - (a.embedding <=> query_embedding) as similarity
    from public.animals a
    where a.embedding is not null
      and a.owner_id is not null
      and 1 - (a.embedding <=> query_embedding) >= match_threshold
    order by a.embedding <=> query_embedding
    limit match_count;
$$;

-- 8. Storage bucket for photos ------------------------------------------------
insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', true)
on conflict (id) do nothing;
