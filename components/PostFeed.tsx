
"use client";

import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import type { Item } from "../types/Items";
import { useRouter } from "next/navigation";

export default function PostFeed() {
    const [query, setQuery] = useState('');
    const router = useRouter();
    const [posts, setPosts] = useState<Item[]>([]);

    useEffect(() => {
        const savedPost = localStorage.getItem("foundu-posts");

        if (savedPost) {
            setPosts(JSON.parse(savedPost));
        }
    }, []);

    const filteredPosts = posts.filter((post) => {
        const searchText = `${post.title ?? ""} ${post.description ?? ""} ${post.location}`.toLowerCase();

        return searchText.includes(query.toLowerCase());
    });

    return (
        <div className="min-h-screen flex-grow bg-orange-50 px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-4xl">
                        
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-extrabold text-gray-900">
                FoundU
            </h1>

            <div className="w-full sm:max-w-md">
                <SearchBar
                    query={query}
                    onQueryChange={setQuery}
                />
            </div>
        </div>

        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-md">
            <button
                type="button"
                onClick={() => router.push("/newPost")}
                className="w-full rounded-full bg-[#ff914d] px-4 py-3 font-semibold text-white shadow-md transition hover:bg-orange-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
                                Try searching with a different title, description, or location.
                            </p>
                        </div>
                    ) : (
                        filteredPosts.map((post) => (
                            <article
                                key={post.id}
                                className="rounded-xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-lg"
                            >
                                {post.image_data && (
                                    <img
                                        src={post.image_data}
                                        alt={post.title || "Lost or found item"}
                                        className="mb-4 h-56 w-full rounded-xl border border-gray-200 object-contain shadow-sm"
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

                                <h2 className="text-xl font-bold text-gray-900">
                                    {post.title || "Untitled item"}
                                </h2>

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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
