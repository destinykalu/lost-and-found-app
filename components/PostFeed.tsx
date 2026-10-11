"use client";

import React, { useState, useEffect, useCallback } from "react";
import SearchBar from "./SearchBar";
import type { Item } from "../types/Items";
import { useRouter } from "next/navigation";
import CampusSelector from "./CampusSelector";

type CampusItem = Item & {
  campus?: string;
  campus_id?: string;
};

export default function PostFeed() {
  const [query, setQuery] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [posts, setPosts] = useState<Item[]>([]);
  const router = useRouter();

  const loadPosts = useCallback(() => {
    try {
      const savedPosts = localStorage.getItem("foundu-posts");

      if (savedPosts) {
        const parsedPosts: Item[] = JSON.parse(savedPosts);
        setPosts(Array.isArray(parsedPosts) ? parsedPosts : []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Could not load saved posts:", error);
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    loadPosts();

    const savedCampus = localStorage.getItem("foundu-campus");
    if (savedCampus) {
      setSelectedCampus(savedCampus);
    }

    const handlePageShow = () => loadPosts();

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handlePageShow);
    };
  }, [loadPosts]);

  // Save the conversation and open the correct chat.
  const openChat = (item: CampusItem) => {
    const postId = String(item.id);

    try {
      const savedChats = localStorage.getItem("foundu-chats");
      const chats: { postId: string }[] = savedChats
        ? JSON.parse(savedChats)
        : [];

      // Add this chat only if it does not already exist.
      if (!chats.some((chat) => String(chat.postId) === postId)) {
        chats.unshift({ postId });
        localStorage.setItem("foundu-chats", JSON.stringify(chats));
      }
    } catch (error) {
      console.error("Could not save chat:", error);
    }

    // Matches app/chat/[id]/page.tsx
    router.push(`/chat/${postId}`);
  };

  const filteredPosts = posts.filter((post) => {
    const item = post as CampusItem;

    const searchText =
      `${item.title ?? ""} ${item.description ?? ""} ${item.location ?? ""}`.toLowerCase();

    const matchesSearch = searchText.includes(query.trim().toLowerCase());

    // Support both campus field names.
    const postCampus = item.campus ?? item.campus_id ?? "";

    const matchesCampus =
      selectedCampus === "" || postCampus === selectedCampus;

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
              <CampusSelector onCampusChange={setSelectedCampus} />
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

        <div className="mt-6 grid gap-4">
          {posts.length === 0 ? (
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
                Try another search or campus. Posts must have a matching campus saved to appear under a specific school.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCampus("");
                  localStorage.removeItem("foundu-campus");
                }}
                className="mt-4 rounded-full border border-orange-300 px-4 py-2 font-semibold text-orange-700 hover:bg-orange-50"
              >
                Show All Campuses
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const item = post as CampusItem;

              return (
                <article
                  key={post.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-lg"
                >
                  {item.image_data && (
                    <img
                      src={item.image_data}
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
                      {item.user_name}
                    </p>

                    {(item.campus || item.campus_id) && (
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">
                          Campus:
                        </span>{" "}
                        {item.campus || item.campus_id}
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
                      onClick={() => openChat(item)}
                      className="flex-1 rounded-full bg-[#f99e66] px-4 py-2 font-semibold text-white transition hover:bg-orange-600"
                    >
                      Message Poster
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}