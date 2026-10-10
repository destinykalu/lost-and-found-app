CREATE TABLE public.campuses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL, 
stat text NOT NULL,
state text NOT NULL DEFAULT 'GA'
);

CREATE TABLE public.items(id uuid PRIMARY KEY DEEFAULT gen_random_uuid(), 
campus_id uuid NOT NULL
    REFERENCES public.campuses(id) ON DELETE RESTRICT,
type text NOT NULL
    CHECK (type IN ('found','lost')),
title text NOT NULL
    description text,
    location text NOT NULL,
    date_recorded date NOT NULL,
    image_url text,
    status text NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'in_verification',npx supabase migration new create_meetups_and_claimsvnpx supabase migration new create_meetups_and_claims
                'meetup_scheduled',
                'resolved',
                'unresolved',
            )
        ),
    user_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
    );