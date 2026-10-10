CREATE TABLE public.meetups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id uuid NOT NULL
        REFERENCES public.chats(id) ON DELETE CASCADE,
    proposed_by_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_time timestamptz NOT NULL,
    location text,
    approval_status text NOT NULL DEFAULT 'pending'
        CHECK (
            approval_status IN ('pending', 'approved', 'denied')
        ),
    item_received boolean,
    search_attempts int NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now()
);