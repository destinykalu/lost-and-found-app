CREATE TABLE public.chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid NOT NULL
        REFERENCES public.items(id) ON DELETE CASCADE,
    finder_id text NOT NULL,
    claimant_id text NOT NULL,
    status text NOT NULL DEFAULT 'open'
        CHECK (
            status IN (
                'open',
                'closed_unverified',
                'closed_blocked',
                'closed_resolved',

                 )
        ),
    is_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id uuid NOT NULL
        REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id text NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);



CREATE TABLE public.chat_moderation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id uuid NOT NULL
        REFERENCES public.chats(id) ON DELETE CASCADE,
    action text NOT NULL
        CHECK (action IN ('unverify','block','report')),
    initiated_by_id text NOT NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);
