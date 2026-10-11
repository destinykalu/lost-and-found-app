
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Item } from "../types/Items";

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

type ActionType = "Unverify" | "Block" | "Report";

interface MeetupProposal {
  time: string;
  location: string;
  proposedBy: "me" | "them";
  status: "proposed" | "approved" | "denied";
}

export default function ItemChatView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = String(params?.id ?? "");

  const [post, setPost] = useState<Item | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatKey = `foundu-chat-${postId}`;

  // Action drawer and verification
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<ActionType | null>(null);
  const [verified, setVerified] = useState(false);

  const [answers, setAnswers] = useState({
    itemDescription: "",
    identifyingDetails: "",
    proofOfOwnership: "",
  });

  // Meetup scheduling and resolution
  const [meetup, setMeetup] = useState<MeetupProposal | null>(null);
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [meetupTime, setMeetupTime] = useState("");
  const [meetupLocation, setMeetupLocation] = useState("");
  const [receivedOpen, setReceivedOpen] = useState(false);
  const [searchAttempts, setSearchAttempts] = useState(0);
  const [notice, setNotice] = useState("");

  // Load existing local data
  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem("foundu-posts");

      if (savedPosts) {
        const all: Item[] = JSON.parse(savedPosts);
        setPost(all.find((p) => String(p.id) === postId) ?? null);
      }

      const savedChat = localStorage.getItem(chatKey);
      if (savedChat) {
        setMessages(JSON.parse(savedChat));
      }

      const savedMeetup = localStorage.getItem(`foundu-meetup-${postId}`);
      if (savedMeetup) {
        setMeetup(JSON.parse(savedMeetup));
      }

      const savedAttempts = localStorage.getItem(
        `foundu-search-attempts-${postId}`
      );

      if (savedAttempts) {
        setSearchAttempts(Number(savedAttempts) || 0);
      }

      const savedVerified = localStorage.getItem(
        `foundu-verified-${postId}`
      );

      setVerified(savedVerified === "true");
    } catch (error) {
      console.error("Could not load chat data:", error);
    }

    setLoaded(true);
  }, [postId, chatKey]);

  // Keep the newest message visible
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveMeetup = (next: MeetupProposal) => {
    setMeetup(next);

    localStorage.setItem(
      `foundu-meetup-${postId}`,
      JSON.stringify(next)
    );
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    const text = draft.trim();
    if (!text) return;

    const next: ChatMessage[] = [
      ...messages,
      {
        id: crypto.randomUUID(),
        sender: "me",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      },
    ];

    setMessages(next);
    localStorage.setItem(chatKey, JSON.stringify(next));
    setDraft("");
  };

  // Frontend-only moderation log
  const logAction = (action: string) => {
    try {
      const key = "foundu-moderation-log";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");

      existing.unshift({
        id: crypto.randomUUID(),
        action,
        postId,
        time: new Date().toISOString(),
      });

      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error("Could not save moderation action:", error);
    }
  };

  const confirmAction = () => {
    if (!confirmation) return;

    const action = confirmation;

    if (action === "Unverify") {
      try {
        const savedPosts = JSON.parse(
          localStorage.getItem("foundu-posts") || "[]"
        );

        const updatedPosts = savedPosts.map(
          (item: Record<string, unknown>) =>
            String(item.id) === postId
              ? { ...item, status: "unavailable" }
              : item
        );

        localStorage.setItem("foundu-posts", JSON.stringify(updatedPosts));
      } catch (error) {
        console.error("Could not update item:", error);
      }
    }

    logAction(action.toLowerCase());

    setConfirmation(null);
    setDrawerOpen(false);
    router.push("/homepage");
  };

  const submitVerification = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !answers.itemDescription.trim() ||
      !answers.identifyingDetails.trim() ||
      !answers.proofOfOwnership.trim()
    ) {
      setNotice("Please answer all verification questions.");
      return;
    }

    setVerified(true);
    localStorage.setItem(`foundu-verified-${postId}`, "true");
    logAction("verify");

    setVerificationOpen(false);
    setNotice("Verification questionnaire submitted.");
  };

  // Propose or update meetup
  const proposeMeetup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetupTime || !meetupLocation.trim()) return;

    saveMeetup({
      time: meetupTime,
      location: meetupLocation.trim(),
      proposedBy: "me",
      status: "proposed",
    });

    setMeetupOpen(false);
    setNotice("Meetup proposal saved.");
  };

  const respondToMeetup = (response: "approved" | "denied") => {
    if (!meetup) return;

    saveMeetup({
      ...meetup,
      status: response,
    });

    setNotice(
      response === "approved"
        ? "Meetup approved."
        : "Meetup denied."
    );
  };

  // Item Received? Yes / No
  const resolveItem = (received: boolean) => {
    if (received) {
      try {
        const savedPosts = JSON.parse(
          localStorage.getItem("foundu-posts") || "[]"
        );

        const updatedPosts = savedPosts.map(
          (item: Record<string, unknown>) =>
            String(item.id) === postId
              ? { ...item, status: "resolved" }
              : item
        );

        localStorage.setItem("foundu-posts", JSON.stringify(updatedPosts));
        localStorage.setItem(`foundu-meetup-received-${postId}`, "true");

        logAction("item received");
        setReceivedOpen(false);
        router.push("/homepage");
      } catch (error) {
        console.error("Could not resolve item:", error);
        setNotice("Could not update the item.");
      }

      return;
    }

    if (searchAttempts >= 3) {
      setReceivedOpen(false);
      setNotice("You have reached the maximum of 3 search attempts.");
      return;
    }

    const nextAttempts = searchAttempts + 1;

    setSearchAttempts(nextAttempts);
    localStorage.setItem(
      `foundu-search-attempts-${postId}`,
      String(nextAttempts)
    );

    setReceivedOpen(false);

    if (nextAttempts >= 3) {
      setNotice("Search attempt 3 of 3 used. Maximum attempts reached.");
    } else {
      setNotice(`Item not received. Search again (${nextAttempts}/3 attempts used).`);

      if (meetup) {
        saveMeetup({
          ...meetup,
          status: "denied",
        });
      }
    }
  };

  if (!loaded) {
    return <div className="min-h-screen flex-grow bg-orange-50" />;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex-grow bg-orange-50 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Item not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            This post may have been removed.
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
        {/* Back button and action drawer */}
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

        {notice && (
          <div
            role="status"
            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-white px-4 py-3 text-sm text-rose-800"
          >
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              className="font-bold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Item details */}
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
          {post.image_data && (
            <img
              src={post.image_data}
              alt={post.title || "Lost or found item"}
              className="mb-4 h-72 w-full rounded-xl border border-gray-200 object-contain shadow-sm"
            />
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
              <span className="font-semibold text-gray-800">
                Location:
              </span>{" "}
              {post.location}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              <span className="font-semibold text-gray-800">
                Posted by:
              </span>{" "}
              {post.user_name}
            </p>
          </div>
        </article>

        {/* Meetup banner */}
        <section className="mt-5 rounded-xl border border-orange-200 bg-orange-100 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-orange-950">
                📍 Meetup Details
              </h2>

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

                  {meetup.status === "proposed" && (
                    <p className="mt-1 text-xs text-orange-800">
                      Proposed by:{" "}
                      {meetup.proposedBy === "me" ? "You" : "Other user"}
                    </p>
                  )}
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
                meetup?.status === "proposed" &&
                meetup.proposedBy === "me"
              }
              onClick={() => {
                setMeetupTime(meetup?.time || "");
                setMeetupLocation(meetup?.location || "");
                setMeetupOpen(true);
              }}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Propose / Update
            </button>
          </div>

          {meetup?.status === "proposed" &&
            meetup.proposedBy === "me" && (
              <p className="mt-3 text-xs text-orange-800">
                You cannot change your proposal until the other user
                approves or denies it.
              </p>
            )}

          {meetup?.status === "proposed" &&
            meetup.proposedBy === "them" && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => respondToMeetup("approved")}
                  className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Approved
                </button>

                <button
                  type="button"
                  onClick={() => respondToMeetup("denied")}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
                >
                  Denied
                </button>
              </div>
            )}

          {meetup?.status === "approved" && (
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

        {/* Chat */}
        <section className="mt-5 overflow-hidden rounded-xl border border-rose-100 bg-white shadow-md">
          <header className="flex items-center gap-3 border-b border-rose-100 bg-gradient-to-r from-pink-100 to-rose-100 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-300 text-lg font-bold text-white shadow-sm">
              {(post.user_name || "?").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-rose-900">
                Chat with {post.user_name || "poster"}
              </h2>

              <p className="text-xs text-rose-600">
                About: {post.title || "Untitled item"}
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
              disabled={!draft.trim()}
              className="rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      </div>

      {/* Slide-out action drawer */}
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
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setVerificationOpen(true);
                }}
                className="rounded-xl border border-green-200 bg-green-50 p-4 text-left font-semibold text-green-800 hover:bg-green-100"
              >
                ✓ Verify
                <span className="mt-1 block text-xs font-normal">
                  Answer questions about item ownership.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmation("Unverify")}
                className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-left font-semibold text-orange-800 hover:bg-orange-100"
              >
                Unverify
                <span className="mt-1 block text-xs font-normal">
                  Mark the item unavailable and leave the chat.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmation("Block")}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-left font-semibold text-gray-800 hover:bg-gray-100"
              >
                Block
                <span className="mt-1 block text-xs font-normal">
                  Log a block and leave the chat.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmation("Report")}
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-left font-semibold text-red-800 hover:bg-red-100"
              >
                Report
                <span className="mt-1 block text-xs font-normal">
                  Log a report and leave the chat.
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Verification questionnaire */}
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
              Answer these questions to help establish ownership.
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
                Back
              </button>

              <button
                type="submit"
                className="rounded-full bg-rose-400 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Submit Answers
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unverify, Block, and Report confirmation */}
      {confirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold text-gray-900">
              Are you sure?
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {confirmation === "Unverify"
                ? "This will mark the item unavailable and close this chat."
                : confirmation === "Block"
                ? "This will log the block and close this chat."
                : "This will log the report and close this chat."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>

              <button
                type="button"
                onClick={confirmAction}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose or update meetup */}
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
                Back
              </button>

              <button
                type="submit"
                className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Submit Proposal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item Received? resolution modal */}
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
              Did the item successfully reach its owner? Selecting Yes
              resolves the item. Selecting No starts another search attempt.
            </p>

            <p className="mt-3 text-xs text-gray-500">
              Search attempts used: {searchAttempts}/3
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => resolveItem(false)}
                className="rounded-full border border-rose-200 bg-white px-6 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                No, Search Again
              </button>

              <button
                type="button"
                onClick={() => resolveItem(true)}
                className="rounded-full bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Yes, Received
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
