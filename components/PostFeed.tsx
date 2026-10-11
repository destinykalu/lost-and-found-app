
"use client";

import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";
import CampusSelector from "./CampusSelector";
import { supabase } from "../lib/supabase";

type FeedPost = {
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
  user_name?: string;
  campuses?: { name: string } | null;
};

export default function PostFeed() {
  const [query, setQuery] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  // Load posts directly from Supabase.
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("items")
        .select("*, campuses(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const rows = (data ?? []) as unknown as FeedPost[];

      // Use the image_url stored in the database directly.
      const postsWithCampus = rows.map((post) => ({
        ...post,
        campus: post.campuses?.name ?? "",
      }));

      setPosts(postsWithCampus);
    } catch (err) {
      console.error("Could not load posts:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load posts. Please try again."
      );

      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedCampus = localStorage.getItem("foundu-campus");

    if (savedCampus) {
      setSelectedCampus(savedCampus);
    }

    void loadPosts();

    const handlePageShow = () => {
      void loadPosts();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
    };
  }, [loadPosts]);

  // Keep the selected campus preference.
  const handleCampusChange = (campus: string) => {
    setSelectedCampus(campus);

    if (campus) {
      localStorage.setItem("foundu-campus", campus);
    } else {
      localStorage.removeItem("foundu-campus");
    }
  };

  // Open or create a conversation in Supabase.
  const openChat = async (item: FeedPost) => {
    try {
      setError("");

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
    }
  };

  // Search titles, descriptions, locations, and selected campus.
  const filteredPosts = posts.filter((post) => {
    const searchText =
      `${post.title ?? ""} ${post.description ?? ""} ${post.location ?? ""}`
        .toLowerCase();

    const matchesSearch = searchText.includes(
      query.trim().toLowerCase()
    );

    const matchesCampus =
      selectedCampus === "" || post.campus === selectedCampus;

    return matchesSearch && matchesCampus;
  });

  return (
    <div className="min-h-screen flex-grow bg-orange-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">
            FoundU
          </h1>

          <div className="flex w-full flex-col gap-4">
            <SearchBar
              query={query}
              onQueryChange={setQuery}
            />

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-md">
              <CampusSelector
                onCampusChange={handleCampusChange}
              />
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-md">
          <button
            type="button"
            onClick={() => router.push("/newPost")}
            className="w-full rounded-full bg-[#f99e66] px-4 py-3 font-semibold text-white shadow-md transition hover:bg-orange-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Create New Post
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700"
          >
            {error}

            <button
              type="button"
              onClick={() => void loadPosts()}
              className="ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">
                No posts yet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Be the first to share a lost or found item!
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">
                No matching posts
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Try another search or campus.
              </p>

              <button
                type="button"
                onClick={() => handleCampusChange("")}
                className="mt-4 rounded-full border border-orange-300 px-4 py-2 font-semibold text-orange-700 hover:bg-orange-50"
              >
                Show All Campuses
              </button>
            </div>
          ) : (
            filteredPosts.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-lg"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title || "Lost or found item"}
                    className="mb-4 h-56 w-full rounded-xl border border-gray-200 object-contain shadow-sm"
                  />
                )}

                <div className="mb-3 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                      item.type === "lost"
                        ? "bg-pink-100 text-pink-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.type}
                  </span>

                  <span className="text-xs text-gray-500">
                    {item.date_recorded}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  {item.title || "Untitled item"}
                </h2>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                  {item.description || "No description provided."}
                </p>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">
                      Location:
                    </span>{" "}
                    {item.location}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">
                      Posted by:
                    </span>{" "}
                    {item.user_name || "Community member"}
                  </p>

                  {item.campus && (
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-semibold text-gray-800">
                        Campus:
                      </span>{" "}
                      {item.campus}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push(`/post/${item.id}`)}
                    className="flex-1 rounded-full border border-orange-300 px-4 py-2 font-semibold text-orange-700 transition hover:bg-orange-50"
                  >
                    View Full Item
                  </button>

                  <button
                    type="button"
                    onClick={() => void openChat(item)}
                    className="flex-1 rounded-full bg-[#f99e66] px-4 py-2 font-semibold text-white transition hover:bg-orange-600"
                  >
                    Message Poster
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
