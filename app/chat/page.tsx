"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

interface SavedPost {
  id: string | number;
  title?: string;
  description?: string;
  user_name?: string;
  image_data?: string;
  type?: string;
}

interface SavedChat {
  postId: string;
}

export default function ChatListPage() {
  const router = useRouter();
  const [chats, setChats] = useState<SavedPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedChats = localStorage.getItem("foundu-chats");
      const savedPosts = localStorage.getItem("foundu-posts");

      const chatList: SavedChat[] = savedChats
        ? JSON.parse(savedChats)
        : [];

      const posts: SavedPost[] = savedPosts
        ? JSON.parse(savedPosts)
        : [];

      const conversations = chatList
        .map((chat) =>
          posts.find((post) => String(post.id) === String(chat.postId))
        )
        .filter((post): post is SavedPost => post !== undefined);

      setChats(conversations);
    } catch (error) {
      console.error("Could not load chats:", error);
      setChats([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-orange-50">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
            My Chats
          </h1>

          <p className="mb-6 text-sm text-gray-600">
            Open a conversation to continue messaging about a lost or found item.
          </p>

          {!loaded ? (
            <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800">
                No chats yet
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Find an item on the home feed and select Message Poster to start
                a conversation.
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
            <div className="grid gap-3">
              {chats.map((post) => (
                <button
                  key={String(post.id)}
                  type="button"
                  onClick={() => router.push(`/chat/${post.id}`)}
                  className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-orange-300 hover:shadow-md"
                >
                  {post.image_data ? (
                    <img
                      src={post.image_data}
                      alt={post.title || "Item"}
                      className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-contain"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-2xl">
                      💬
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-gray-900">
                      {post.title || "Untitled item"}
                    </h2>

                    <p className="mt-1 truncate text-sm text-gray-600">
                      Chat with {post.user_name || "poster"}
                    </p>

                    <p className="mt-1 text-xs capitalize text-orange-700">
                      {post.type || "Lost or found item"}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-orange-600">
                    Open →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}