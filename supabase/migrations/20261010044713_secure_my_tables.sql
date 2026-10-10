-- 1. Turn on security for all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_moderation ENABLE ROW LEVEL SECURITY;

-- 2. Items: Anyone signed in can view active listings
CREATE POLICY "View active items"
ON public.items
FOR SELECT TO authenticated
USING (status = 'active');

-- 3. Chats: Only finder or claimant can view the chat room
CREATE POLICY "View own chats"
ON public.chats
FOR SELECT TO authenticated
USING (auth.uid() = finder_id OR auth.uid() = claimant_id);

-- 4. Messages: Both can view messages, but ONLY FINDERS can post
CREATE POLICY "View chat messages"
ON public.messages
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
    AND (chats.finder_id = auth.uid() OR chats.claimant_id = auth.uid())
  )
);

CREATE POLICY "Only finders can post messages"
ON public.messages
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = messages.chat_id
    AND chats.finder_id = auth.uid()
    AND chats.status = 'open'
  )
);

-- 5. Meetups: Participants can propose and edit, restricted to their chat
CREATE POLICY "Participants can propose meetups"
ON public.meetups
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = proposed_by_id AND
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = meetups.chat_id
    AND (chats.finder_id = auth.uid() OR chats.claimant_id = auth.uid())
  )
);

CREATE POLICY "Participants can edit meetups"
ON public.meetups
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = meetups.chat_id
    AND (chats.finder_id = auth.uid() OR chats.claimant_id = auth.uid())
  )
);