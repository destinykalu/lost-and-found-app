"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Item {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string | null;
  location: string;
  date_recorded: string;
  image_url: string | null;
  status: string;
  user_id: string;
}

interface ChatRecord {
  id: string;
  item_id: string;
  finder_id: string;
  claimant_id: string;
  status: string;
  is_verified: boolean;
}

interface DbMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

interface DbMeetup {
  id: string;
  chat_id: string;
  proposed_by_id: string;
  scheduled_time: string;
  location: string | null;
  approval_status: string;
  item_received: boolean | null;
  search_attempts: number;
  created_at: string;
}

interface MeetupProposal {
  id: string;
  time: string;
  location: string;
  proposedBy: "me" | "them";
  status: "proposed" | "approved" | "denied";
  itemReceived: boolean | null;
  searchAttempts: number;
}

type ActionType = "Approve Verification" | "Unverify" | "Block" | "Report";
type ModerationAction = "unverify" | "block" | "report";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapMeetup(
  row: DbMeetup,
  currentUserId: string
): MeetupProposal {
  const status = (row.approval_status || "pending").toLowerCase();

  return {
    id: row.id,
    time: row.scheduled_time,
    location: row.location ?? "",
    proposedBy: row.proposed_by_id === currentUserId ? "me" : "them",
    status:
      status === "approved" || status === "denied"
        ? (status as "approved" | "denied")
        : "proposed",
    itemReceived: row.item_received,
    searchAttempts: row.search_attempts ?? 0,
  };
}

export default function ItemChatView({
  chatId: chatIdProp,
}: {
  chatId?: string;
}) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const chatId = chatIdProp || String(params?.id ?? "");

  const [post, setPost] = useState<Item | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [chat, setChat] = useState<ChatRecord | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<ActionType | null>(null);
  const [verified, setVerified] = useState(false);

  const [answers, setAnswers] = useState({
    itemDescription: "",
    identifyingDetails: "",
    proofOfOwnership: "",
  });

  const [meetup, setMeetup] = useState<MeetupProposal | null>(null);
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [meetupTime, setMeetupTime] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [receivedOpen, setReceivedOpen] = useState(false);
  const [searchAttempts, setSearchAttempts] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role Checks
  const isClaimant = currentUserId === chat?.claimant_id;
  const isFinder = currentUserId === chat?.finder_id;

  const loadMessages = useCallback(
    async (activeChatId: string, userId: string) => {
      const { data, error: messagesError } = await supabase
        .from("messages")
        .select("id, chat_id, sender_id, content, created_at")
        .eq("chat_id", activeChatId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      const mapped: ChatMessage[] = ((data ?? []) as DbMessage[]).map(
        (message) => ({
          id: message.id,
          sender: message.sender_id === userId ? "me" : "them",
          text: message.content,
          time: formatTime(message.created_at),
        })
      );

      setMessages(mapped);
    },
    []
  );

  const loadMeetup = useCallback(
    async (activeChatId: string, userId: string) => {
      const { data, error: meetupError } = await supabase
        .from("meetups")
        .select(
          "id, chat_id, proposed_by_id, scheduled_time, location, approval_status, item_received, search_attempts, created_at"
        )
        .eq("chat_id", activeChatId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (meetupError) throw meetupError;

      const latest = (data?.[0] ?? null) as DbMeetup | null;

      if (!latest) {
        setMeetup(null);
        setSearchAttempts(0);
        return;
      }

      const mapped = mapMeetup(latest, userId);
      setMeetup(mapped);
      setSearchAttempts(mapped.searchAttempts);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoaded(false);
      setError("");

      try {
        const {
            data: { session },
            error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
            throw sessionError;
            }

            if (!session?.user) {
            router.replace("/login");
            return;
            }

            const user = session.user;
        if (cancelled) return;
        setCurrentUserId(user.id);

        const { data: chatData, error: chatError } = await supabase
          .from("chats")
          .select(
            "id, item_id, finder_id, claimant_id, status, is_verified"
          )
          .eq("id", chatId)
          .maybeSingle();

        if (chatError) throw chatError;

        if (!chatData) {
          throw new Error("This conversation could not be found.");
        }

        const chatRecord = chatData as ChatRecord;

        if (
          chatRecord.finder_id !== user.id &&
          chatRecord.claimant_id !== user.id
        ) {
          throw new Error("You do not have access to this conversation.");
        }

        if (cancelled) return;

        setChat(chatRecord);
        setVerified(Boolean(chatRecord.is_verified));

        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select(
            "id, type, title, description, location, date_recorded, image_url, status, user_id"
          )
          .eq("id", chatRecord.item_id)
          .maybeSingle();

        if (itemError) throw itemError;

        if (!itemData) {
          throw new Error("The item associated with this chat was not found.");
        }

        if (cancelled) return;
        setPost(itemData as Item);

        await Promise.all([
          loadMessages(chatRecord.id, user.id),
          loadMeetup(chatRecord.id, user.id),
        ]);
      } catch (loadError: any) {
        console.error("Could not load chat - Full error:", loadError);
        setError(
          loadError?.message ||
          (typeof loadError === "object" && loadError !== null ? JSON.stringify(loadError) : null) ||
          "Could not load this conversation."
        );
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    if (chatId) {
      void loadData();
    } else {
      setError("No conversation ID was provided.");
      setLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [chatId, router, loadMessages, loadMeetup]);

  useEffect(() => {
    if (!chat?.id || !currentUserId) return;

    const channel = supabase
      .channel(`foundu-chat-${chat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chat.id}`,
        },
        (payload) => {
          const row = payload.new as DbMessage;

          setMessages((current) => {
            if (current.some((message) => message.id === row.id)) {
              return current;
            }

            return [
              ...current,
              {
                id: row.id,
                sender: row.sender_id === currentUserId ? "me" : "them",
                text: row.content,
                time: formatTime(row.created_at),
              },
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chats",
          filter: `id=eq.${chat.id}`,
        },
        (payload) => {
          const updated = payload.new as ChatRecord;
          setChat(updated);
          setVerified(Boolean(updated.is_verified));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chat?.id, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = draft.trim();
    if (!content || !chat || !currentUserId || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          chat_id: chat.id,
          sender_id: currentUserId,
          content,
        })
        .select("id, chat_id, sender_id, content, created_at")
        .single();

      if (insertError) throw insertError;

      const row = data as DbMessage;

      setMessages((current) => {
        if (current.some((message) => message.id === row.id)) return current;
        return [
          ...current,
          {
            id: row.id,
            sender: "me",
            text: row.content,
            time: formatTime(row.created_at),
          },
        ];
      });

      setDraft("");
    } catch (sendError: any) {
      console.error("Could not send message - Full error:", sendError);
      setError(sendError?.message || "Could not send your message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const logAction = async (action: ModerationAction, reason?: string) => {
    if (!chat) throw new Error("Conversation not found.");

    const { error: insertError } = await supabase
      .from("chat_moderation")
      .insert({
        chat_id: chat.id,
        action,
        initiated_by_id: currentUserId,
        reason: reason?.trim() || null,
      });

    if (insertError) throw insertError;
  };

  const confirmAction = async () => {
    if (!confirmation || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (confirmation === "Approve Verification") {
        const { data, error: updateError } = await supabase
          .from("chats")
          .update({ is_verified: true })
          .eq("id", chat!.id)
          .select("id, item_id, finder_id, claimant_id, status, is_verified")
          .single();

        if (updateError) throw updateError;
        setChat(data as ChatRecord);
        setVerified(true);
        setNotice("User has been verified. Meetups are now unlocked!");
        
      } else if (confirmation === "Unverify") {
        await logAction("unverify");
        const { data, error: updateError } = await supabase
          .from("chats")
          .update({ is_verified: false })
          .eq("id", chat!.id)
          .select("id, item_id, finder_id, claimant_id, status, is_verified")
          .single();

        if (updateError) throw updateError;
        setChat(data as ChatRecord);
        setVerified(false);
        setNotice("Verification removed.");

      } else if (confirmation === "Block") {
        await logAction("block");
        
        // 🚨 Delete the chat completely to remove access
        const { error: deleteError } = await supabase
          .from("chats")
          .delete()
          .eq("id", chat!.id);

        if (deleteError) throw deleteError;

        setNotice("User blocked and chat deleted.");
        router.push("/homepage"); 
        return; // Stop execution here so the UI doesn't crash trying to render a deleted chat
        
      } else if (confirmation === "Report") {
        await logAction("report");
        setNotice("Report submitted successfully.");
      }

      setConfirmation(null);
      setDrawerOpen(false);
    } catch (actionError: any) {
      console.error("Action failed:", JSON.stringify(actionError, null, 2));
      setError(actionError?.message || "Could not complete this action.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submitting verification answers now sends a chat message instead of updating DB instantly
  const submitVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !answers.itemDescription.trim() ||
      !answers.identifyingDetails.trim() ||
      !answers.proofOfOwnership.trim()
    ) {
      setNotice("Please answer all verification questions.");
      return;
    }

    if (!chat || !currentUserId) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const content = `*** VERIFICATION REQUEST ***\n\nDescription: ${answers.itemDescription}\nDetails: ${answers.identifyingDetails}\nProof: ${answers.proofOfOwnership}`;

      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          chat_id: chat.id,
          sender_id: currentUserId,
          content,
        })
        .select("id, chat_id, sender_id, content, created_at")
        .single();

      if (insertError) throw insertError;

      const row = data as DbMessage;
      setMessages((current) => {
        if (current.some((message) => message.id === row.id)) return current;
        return [
          ...current,
          {
            id: row.id,
            sender: "me",
            text: row.content,
            time: formatTime(row.created_at),
          },
        ];
      });

      setVerificationOpen(false);
      setNotice("Verification answers sent to the finder for review!");
      setAnswers({ itemDescription: "", identifyingDetails: "", proofOfOwnership: "" });
    } catch (err: any) {
      console.error("Verification failed:", JSON.stringify(err, null, 2));
      setError(err?.message || "Could not send verification answers.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const proposeMeetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chat || !currentUserId || !meetupTime || !meetupLocation.trim()) {
      return;
    }

    const scheduledDate = new Date(meetupTime);

    if (
      Number.isNaN(scheduledDate.getTime()) ||
      scheduledDate.getTime() <= Date.now()
    ) {
      setError("Choose a future date and time for the meetup.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const { data: existingRows, error: existingError } = await supabase
        .from("meetups")
        .select("id, proposed_by_id, approval_status")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existingError) throw existingError;

      const latest = existingRows?.[0];

      if (
        latest?.approval_status?.toLowerCase() === "pending" &&
        latest.proposed_by_id === currentUserId
      ) {
        setError(
          "Your current proposal is waiting for a response. You cannot replace it yet."
        );
        return;
      }

      const { data, error: insertError } = await supabase
        .from("meetups")
        .insert({
          chat_id: chat.id,
          proposed_by_id: currentUserId,
          scheduled_time: scheduledDate.toISOString(),
          location: meetupLocation.trim(),
          approval_status: "pending", 
          item_received: null,
          search_attempts: searchAttempts,
        })
        .select(
          "id, chat_id, proposed_by_id, scheduled_time, location, approval_status, item_received, search_attempts, created_at"
        )
        .single();

      if (insertError) throw insertError;

      setMeetup(mapMeetup(data as DbMeetup, currentUserId));
      setMeetupOpen(false);
      setNotice("Meetup proposal saved.");
    } catch (meetupError: any) {
      console.error("Real Error:", JSON.stringify(meetupError, null, 2));
      setError(
        meetupError?.message ||
        (typeof meetupError === "object" && meetupError !== null 
          ? JSON.stringify(meetupError) 
          : "Could not save the meetup proposal.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const respondToMeetup = async (response: "approved" | "denied") => {
    if (!meetup || !chat || meetup.proposedBy !== "them") return;

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const { data, error: updateError } = await supabase
        .from("meetups")
        .update({ approval_status: response })
        .eq("id", meetup.id)
        .eq("chat_id", chat.id)
        .select(
          "id, chat_id, proposed_by_id, scheduled_time, location, approval_status, item_received, search_attempts, created_at"
        )
        .single();

      if (updateError) throw updateError;

      setMeetup(mapMeetup(data as DbMeetup, currentUserId));
      setNotice(response === "approved" ? "Meetup approved." : "Meetup denied.");
    } catch (responseError: any) {
      console.error("Could not respond to meetup:", JSON.stringify(responseError, null, 2));
      setError(responseError?.message || "Could not update the meetup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveItem = async (received: boolean) => {
    if (!meetup || !chat || !post || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (received) {
        const { error: meetupUpdateError } = await supabase
          .from("meetups")
          .update({ item_received: true })
          .eq("id", meetup.id)
          .eq("chat_id", chat.id);

        if (meetupUpdateError) throw meetupUpdateError;

        const { error: itemUpdateError } = await supabase
          .from("items")
          .update({ status: "resolved" })
          .eq("id", post.id);

        if (itemUpdateError) throw itemUpdateError;

        const { error: chatUpdateError } = await supabase
          .from("chats")
          .update({ status: "resolved" })
          .eq("id", chat.id);

        if (chatUpdateError) throw chatUpdateError;

        setReceivedOpen(false);
        router.push("/homepage");
        return;
      }

      if (searchAttempts >= 3) {
        setReceivedOpen(false);
        setNotice("You have reached the maximum of 3 search attempts.");
        return;
      }

      const nextAttempts = searchAttempts + 1;

      const { data, error: updateError } = await supabase
        .from("meetups")
        .update({
          item_received: false,
          search_attempts: nextAttempts,
        })
        .eq("id", meetup.id)
        .eq("chat_id", chat.id)
        .select(
          "id, chat_id, proposed_by_id, scheduled_time, location, approval_status, item_received, search_attempts, created_at"
        )
        .single();

      if (updateError) throw updateError;

      const updatedMeetup = mapMeetup(data as DbMeetup, currentUserId);
      setMeetup(updatedMeetup);
      setSearchAttempts(nextAttempts);
      setReceivedOpen(false);

      setNotice(
        nextAttempts >= 3
          ? "Search attempt 3 of 3 used. Maximum attempts reached."
          : `Item not received. Search again (${nextAttempts}/3 attempts used).`
      );
    } catch (resolveError: any) {
      console.error("Could not update item status:", JSON.stringify(resolveError, null, 2));
      setError(resolveError?.message || "Could not update the item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loaded) {
    return <div className="min-h-screen flex-grow bg-orange-50 p-8" />;
  }

  if (!post || !chat) {
    return (
      <div className="min-h-screen flex-grow bg-orange-50 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Conversation unavailable
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {error || "This conversation or its item could not be found."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/homepage")}
            className="mt-4 rounded-full bg-[#f99e66] px-5 py-2 font-semibold text-white transition hover:bg-orange-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-grow bg-orange-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-semibold text-orange-700 transition hover:text-orange-900"
          >
            ← Back to feed
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-800 shadow-sm hover:bg-rose-50"
          >
            ☰ Chat Actions
          </button>
        </div>

        {(notice || error) && (
          <div
            role={error ? "alert" : "status"}
            className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-rose-200 bg-white text-rose-800"
            }`}
          >
            <span>{error || notice}</span>
            <button
              type="button"
              onClick={() => {
                setNotice("");
                setError("");
              }}
              className="font-bold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
          {post.image_url && (
            <ItemImage imagePath={post.image_url} title={post.title} />
          )}

          <div className="mb-3 flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                post.type === "lost"
                  ? "bg-pink-100 text-pink-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {post.type}
            </span>
            <span className="text-xs text-gray-500">
              {post.date_recorded}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">
            {post.title || "Untitled item"}
          </h1>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
            {post.description || "No description provided."}
          </p>

          <div className="mt-4 border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Location:</span>{" "}
              {post.location}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Posted by:</span>{" "}
              {post.user_id === currentUserId ? "You" : "Item owner"}
            </p>
          </div>
        </article>

        {verified ? (
          <section className="mt-5 rounded-xl border border-orange-200 bg-orange-100 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-orange-950">📍 Meetup Details</h2>

                {meetup?.time && meetup?.location ? (
                  <>
                    <p className="mt-2 text-sm text-orange-900">
                      <strong>Time:</strong>{" "}
                      {new Date(meetup.time).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-orange-900">
                      <strong>Location:</strong> {meetup.location}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase text-orange-800">
                      Status: {meetup.status}
                    </p>
                    <p className="mt-1 text-xs text-orange-800">
                      Proposed by:{" "}
                      {meetup.proposedBy === "me" ? "You" : "Other user"}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-orange-800">
                    No meetup has been proposed yet.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={
                  isSubmitting ||
                  (meetup?.status === "proposed" &&
                    meetup.proposedBy === "me")
                }
                onClick={() => {
                  setMeetupTime("");
                  setMeetupLocation("");
                  setMeetupOpen(true);
                }}
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Propose / Update
              </button>
            </div>

            {meetup?.status === "proposed" && meetup.proposedBy === "me" && (
              <p className="mt-3 text-xs text-orange-800">
                Your proposal is waiting for the other user to respond.
              </p>
            )}

            {meetup?.status === "proposed" && meetup.proposedBy === "them" && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void respondToMeetup("approved")}
                  className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Approved
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void respondToMeetup("denied")}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
                >
                  Denied
                </button>
              </div>
            )}

            {meetup?.status === "approved" && meetup.itemReceived !== true && (
              <button
                type="button"
                onClick={() => setReceivedOpen(true)}
                className="mt-4 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Item Received?
              </button>
            )}

            <p className="mt-3 text-xs text-orange-900">
              Search attempts used: {searchAttempts}/3
            </p>

            {searchAttempts >= 3 && (
              <p className="mt-1 text-sm font-semibold text-red-700">
                Maximum search attempts reached.
              </p>
            )}
          </section>
        ) : (
          <section className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm text-center">
            <h2 className="font-bold text-gray-800">📍 Meetups Locked</h2>
            <p className="mt-2 text-sm text-gray-600">
              {isFinder 
                ? "You must approve the claimant's verification before scheduling a meetup." 
                : "You must submit verification answers and wait for the finder to approve them to unlock meetups."}
            </p>
          </section>
        )}

        <section className="mt-5 overflow-hidden rounded-xl border border-rose-100 bg-white shadow-md">
          <header className="flex items-center gap-3 border-b border-rose-100 bg-gradient-to-r from-pink-100 to-rose-100 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-300 text-lg font-bold text-white shadow-sm">
              {post.title?.charAt(0).toUpperCase() || "?"}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-rose-900">
                Chat about {post.title || "this item"}
              </h2>
              <p className="text-xs text-rose-600">
                Messages sync through Supabase.
              </p>
            </div>

            {verified && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                Verified
              </span>
            )}
          </header>

          <div className="flex h-96 flex-col gap-3 overflow-y-auto bg-rose-50/60 px-4 py-4">
            {messages.length === 0 ? (
              <div className="m-auto text-center">
                <p className="text-sm font-semibold text-rose-700">
                  No messages yet
                </p>
                <p className="mt-1 text-xs text-rose-400">
                  Say hi and describe the item to confirm it&apos;s yours!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "me" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.sender === "me"
                        ? "rounded-br-sm bg-rose-300 text-rose-950"
                        : "rounded-bl-sm border border-pink-100 bg-white text-gray-700"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="mt-1 text-[10px] text-rose-400">
                    {msg.time}
                  </span>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 border-t border-rose-100 bg-white p-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="min-w-0 flex-1 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-gray-800 placeholder-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSubmitting}
              className="rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
          </form>
        </section>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close action drawer"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4">
              <h2 className="text-xl font-extrabold text-rose-900">
                Chat Actions
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Manage verification and safety for this conversation.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {!verified && isClaimant && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setVerificationOpen(true);
                  }}
                  className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-left font-semibold text-blue-800 hover:bg-blue-100"
                >
                  ✓ Get Verified
                  <span className="mt-1 block text-xs font-normal">
                    Submit answers to the finder to prove this item is yours.
                  </span>
                </button>
              )}

              {!verified && isFinder && (
                <button
                  type="button"
                  onClick={() => setConfirmation("Approve Verification")}
                  className="rounded-xl border border-green-200 bg-green-50 p-4 text-left font-semibold text-green-800 hover:bg-green-100"
                >
                  ✓ Approve Verification
                  <span className="mt-1 block text-xs font-normal">
                    Mark this user as verified to unlock meetups.
                  </span>
                </button>
              )}

              {verified && isFinder && (
                <button
                  type="button"
                  onClick={() => setConfirmation("Unverify")}
                  className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-left font-semibold text-orange-800 hover:bg-orange-100"
                >
                  Unverify
                  <span className="mt-1 block text-xs font-normal">
                    Remove the verified status.
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setConfirmation("Block")}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left font-semibold text-gray-800 hover:bg-gray-100"
              >
                Block
                <span className="mt-1 block text-xs font-normal">
                  Record a block action against this user.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmation("Report")}
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-left font-semibold text-red-800 hover:bg-red-100"
              >
                Report
                <span className="mt-1 block text-xs font-normal">
                  Submit a report about this chat.
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {verificationOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={submitVerification}
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold text-rose-900">
              Item Verification
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Answer these questions to help establish ownership. Your answers will be sent to the finder for review.
            </p>

            <label className="mt-5 block text-sm font-semibold text-gray-700">
              Describe the item in detail.
              <textarea
                required
                value={answers.itemDescription}
                onChange={(e) =>
                  setAnswers({ ...answers, itemDescription: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-rose-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                rows={3}
                placeholder="Color, brand, appearance..."
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-gray-700">
              What identifying details can prove ownership?
              <textarea
                required
                value={answers.identifyingDetails}
                onChange={(e) =>
                  setAnswers({
                    ...answers,
                    identifyingDetails: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-rose-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                rows={3}
                placeholder="Unique marks, contents, serial number..."
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-gray-700">
              What proof of ownership can you provide?
              <textarea
                required
                value={answers.proofOfOwnership}
                onChange={(e) =>
                  setAnswers({
                    ...answers,
                    proofOfOwnership: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border border-rose-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                rows={3}
                placeholder="Receipt, original photo, or other evidence..."
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setVerificationOpen(false)}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send Answers"}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold text-gray-900">
              Confirm {confirmation}
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {confirmation === "Approve Verification"
                ? "Are you sure you want to approve this user's verification? This will immediately unlock meetups."
                : confirmation === "Unverify"
                ? "This will remove the user's verified status and lock meetups again."
                : confirmation === "Block"
                ? "This records a block action and deletes the chat completely."
                : "This records a report for review. Administrator notifications are not configured here."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                disabled={isSubmitting}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmAction()}
                disabled={isSubmitting}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {meetupOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={proposeMeetup}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold text-orange-900">
              Propose a Meetup
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Suggest a time and a safe public meeting location.
            </p>

            <label className="mt-5 block text-sm font-semibold text-gray-700">
              Date and time
              <input
                required
                type="datetime-local"
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                value={meetupTime}
                onChange={(e) => setMeetupTime(e.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 p-3 text-sm"
              />
            </label>

            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Meeting location
              <input
                required
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 p-3 text-sm"
                placeholder="Campus library, student center..."
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMeetupOpen(false)}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {receivedOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl">
              📦
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-rose-900">
              Item Received?
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Did the item successfully reach its owner? Yes resolves the item.
              No records another search attempt.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Search attempts used: {searchAttempts}/3
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                disabled={isSubmitting || searchAttempts >= 3}
                onClick={() => void resolveItem(false)}
                className="rounded-full border border-rose-200 bg-white px-6 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                No, Search Again
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void resolveItem(true)}
                className="rounded-full bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Yes, Received"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setReceivedOpen(false)}
              className="mt-4 text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemImage({
  imagePath,
  title,
}: {
  imagePath: string;
  title: string;
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadImage() {
      setSrc("");
      setFailed(false);

      if (/^https?:\/\//i.test(imagePath)) {
        setSrc(imagePath);
        return;
      }

      const { data, error } = await supabase.storage
        .from("item-images")
        .createSignedUrl(imagePath, 60 * 60);

      if (error) {
        console.error("Could not load item image:", error);
        if (!cancelled) setFailed(true);
        return;
      }

      if (!cancelled && data?.signedUrl) {
        setSrc(data.signedUrl);
      } else if (!cancelled) {
        setFailed(true);
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
    };
  }, [imagePath]);

  if (failed) {
    return (
      <div className="mb-4 flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
        Image unavailable
      </div>
    );
  }

  if (!src) {
    return (
      <div className="mb-4 flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
        Loading image...
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title || "Lost or found item"}
      onError={() => setFailed(true)}
      className="mb-4 h-72 w-full rounded-xl border border-gray-200 object-contain shadow-sm"
    />
  );
}