"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Item } from "@/types/Items";
import Sidebar from "@/components/Sidebar";

type CampusItem = Item & {
  campus?: string;
  campus_id?: string;
};

export default function FullItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const postId = String(params?.id ?? "");

  const [item, setItem] = useState<CampusItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem("foundu-posts");

      if (savedPosts) {
        const posts: CampusItem[] = JSON.parse(savedPosts);

        const foundItem = posts.find(
          (post) => String(post.id) === postId
        );

        setItem(foundItem ?? null);
      }
    } catch (error) {
      console.error("Could not load item:", error);
      setItem(null);
    } finally {
      setLoaded(true);
    }
  }, [postId]);

  const openChat = () => {
    if (!item) return;

    try {
      const savedChats = localStorage.getItem("foundu-chats");
      const chats: { postId: string }[] = savedChats
        ? JSON.parse(savedChats)
        : [];

      if (!chats.some((chat) => String(chat.postId) === postId)) {
        chats.unshift({ postId });
        localStorage.setItem("foundu-chats", JSON.stringify(chats));
      }
    } catch (error) {
      console.error("Could not save chat:", error);
    }

    router.push(`/chat/${postId}`);
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
              {item.image_data ? (
                <img
                  src={item.image_data}
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
                      {item.user_name || "Unknown user"}
                    </p>
                  </section>

                  {(item.campus || item.campus_id) && (
                    <section className="border-t border-gray-100 pt-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                        Campus
                      </h2>
                      <p className="mt-2 text-gray-800">
                        {item.campus || item.campus_id}
                      </p>
                    </section>
                  )}

                  {item.status && (
                    <section className="border-t border-gray-100 pt-4">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                        Status
                      </h2>
                      <p className="mt-2 capitalize text-gray-800">
                        {item.status}
                      </p>
                    </section>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={openChat}
                    className="flex-1 rounded-full bg-[#f99e66] px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
                  >
                    Message Poster
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