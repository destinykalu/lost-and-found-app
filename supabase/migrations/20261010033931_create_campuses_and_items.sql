-- 1. Enable the pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create campuses table
CREATE TABLE IF NOT EXISTS public.campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  state text NOT NULL DEFAULT 'GA',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create items table with vector support
CREATE TABLE IF NOT EXISTS public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id uuid NOT NULL REFERENCES public.campuses(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('found', 'lost')),
  title text NOT NULL,
  description text,
  location text NOT NULL,
  date_recorded date NOT NULL DEFAULT CURRENT_DATE,
  image_url text,
  embedding vector(768), -- Stores the image feature array for Google Lens-style matching
  status text NOT NULL DEFAULT 'active' CHECK (
    status IN (
      'active',
      'in_verification',
      'meetup_scheduled',
      'resolved',
      'unresolved'
    )
  ),
  user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- 5. Set public read policies
CREATE POLICY "Allow public read access on campuses"
  ON public.campuses FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on items"
  ON public.items FOR SELECT
  USING (true);

-- 6. Seed Georgia campuses
INSERT INTO public.campuses (name, state) VALUES
  ('Clark Atlanta University', 'GA'),
  ('Morehouse College', 'GA'),
  ('Spelman College', 'GA'),
  ('Georgia State University', 'GA'),
  ('Georgia Tech', 'GA'),
  ('Emory University', 'GA'),
  ('University of Georgia', 'GA'),
  ('Kennesaw State University', 'GA'),
  ('Savannah State University', 'GA')
ON CONFLICT (name) DO NOTHING;

-- 7. Create the Visual Search Matching Function
CREATE OR REPLACE FUNCTION match_found_items (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_campus uuid
)
returns table (
  id uuid,
  title text,
  description text,
  image_url text,
  location text,
  date_recorded date,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    items.id,
    items.title,
    items.description,
    items.image_url,
    items.location,
    items.date_recorded,
    1 - (items.embedding <=> query_embedding) as similarity
  from items
  where items.type = 'found'
    and items.status = 'active'
    and items.campus_id = filter_campus
    and items.date_recorded >= CURRENT_DATE - INTERVAL '10 days'
    and 1 - (items.embedding <=> query_embedding) > match_threshold
  order by items.embedding <=> query_embedding
  limit match_count;
end;
$$;