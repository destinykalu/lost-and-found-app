
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type CampusItem = {
  id: string;
  campus_id: string;
  type: "lost" | "found";
  title: string;
  description: string | null;
  location: string;
  date_recorded: string;
  image_url: string | null;
  status: string;
  user_id: string;
  created_at: string;
  campus?: string;
  campuses?: { name: string } | null;
};

export default function FullItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = String(params?.id ?? "");

  const [item, setItem] = useState<CampusItem | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  // Load the selected item directly from Supabase.
  const loadItem = useCallback(async () => {
    if (!postId) {
      setItem(null);
      setLoaded(true);
      return;
    }

    setLoaded(false);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("items")
        .select("*, campuses(name)")
        .eq("id", postId)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        setItem(null);
        return;
      }

      const row = data as unknown as CampusItem;

      setItem({
        ...row,
        campus: row.campuses?.name ?? "",
      });
    } catch (err) {
      console.error("Could not load item:", err);

      setItem(null);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load this item. Please try again."
      );
    } finally {
      setLoaded(true);
    }
  }, [postId]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  // Find an existing conversation or create one in Supabase.
  const openChat = async () => {
    if (!item || isOpeningChat) return;

    setError("");
    setIsOpeningChat(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      if (user.id === item.user_id) {
        setError("You cannot message yourself about your own post.");
        return;
      }

      const { data: existingChats, error: chatFetchError } =
        await supabase
          .from("chats")
          .select("id, finder_id, claimant_id")
          .eq("item_id", item.id);

      if (chatFetchError) {
        throw chatFetchError;
      }

      const existingChat = (existingChats ?? []).find(
        (chat) =>
          (chat.finder_id === user.id &&
            chat.claimant_id === item.user_id) ||
          (chat.finder_id === item.user_id &&
            chat.claimant_id === user.id)
      );

      if (existingChat) {
        router.push(`/chat/${existingChat.id}`);
        return;
      }

      // For a found item, its owner is the finder.
      // For a lost item, its owner is the claimant.
      const finderId =
        item.type === "found" ? item.user_id : user.id;

      const claimantId =
        item.type === "found" ? user.id : item.user_id;

      const { data: newChat, error: createChatError } =
        await supabase
          .from("chats")
          .insert({
            item_id: item.id,
            finder_id: finderId,
            claimant_id: claimantId,
            status: "active",
            is_verified: false,
          })
          .select("id")
          .single();

      if (createChatError) {
        throw createChatError;
      }

      router.push(`/chat/${newChat.id}`);
    } catch (err) {
      console.error("Could not open chat:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not open the conversation. Please try again."
      );
    } finally {
      setIsOpeningChat(false);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-orange-50 p-8 text-center text-gray-600">
        Loading item...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-orange-50">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => router.push("/homepage")}
            className="mb-5 font-semibold text-orange-700 hover:text-orange-900"
          >
            ← Back to Home
          </button>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700"
            >
              {error}

              <button
                type="button"
                onClick={() => {
                  if (item) {
                    setError("");
                  } else {
                    void loadItem();
                  }
                }}
                className="ml-2 font-semibold underline"
              >
                {item ? "Dismiss" : "Try again"}
              </button>
            </div>
          )}

          {!item ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h1 className="text-xl font-bold text-gray-900">
                Item not found
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                This post may have been removed or is no longer available.
              </p>

              <button
                type="button"
                onClick={() => router.push("/homepage")}
                className="mt-5 rounded-full bg-[#f99e66] px-5 py-2 font-semibold text-white hover:bg-orange-600"
              >
                Browse Posts
              </button>
            </div>
          ) : (
            <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title || "Lost or found item"}
                  className="max-h-[500px] w-full bg-gray-50 object-contain"
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-orange-100 text-gray-500">
                  No image available
                </div>
              )}

              <div className="p-5 sm:p-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      item.type === "lost"
                        ? "bg-pink-100 text-pink-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.type || "Item"}
                  </span>

                  <span className="text-sm text-gray-500">
                    {item.date_recorded || "Date not provided"}
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900">
                  {item.title || "Untitled item"}
                </h1>

                <div className="mt-6 space-y-5">
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                      Description
                    </h2>

                    <p className="mt-2 whitespace-pre-wrap leading-7 text-gray-700">
                      {item.description || "No description provided."}
                    </p>
                  </section>

                  <section className="border-t border-gray-100 pt-4">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                      Location
                    </h2>

                    <p className="mt-2 text-gray-800">
                      {item.location || "No location provided"}
                    </p>
                  </section>

                  <section className="border-t border-gray-100 pt-4">
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                      Posted By
                    </h2>

                    <p className="mt-2 text-gray-800">
                      Community member
                    </p>
                  </section>

                  {item.campus && (
                    <section className="border-t border-gray-100 pt-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                        Campus
                      </h2>

                      <p className="mt-2 text-gray-800">
                        {item.campus}
                      </p>
                    </section>
                  )}

                  {item.status && (
                    <section className="border-t border-gray-100 pt-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                        Status
                      </h2>

                      <p className="mt-2 capitalize text-gray-800">
                        {item.status.replace(/_/g, " ")}
                      </p>
                    </section>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void openChat()}
                    disabled={isOpeningChat}
                    className="flex-1 rounded-full bg-[#f99e66] px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isOpeningChat
                      ? "Opening Chat..."
                      : "Message Poster"}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/homepage")}
                    className="flex-1 rounded-full border border-orange-300 px-5 py-3 font-semibold text-orange-700 transition hover:bg-orange-50"
                  >
                    Back to Posts
                  </button>
                </div>
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
