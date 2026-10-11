"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CampusSelector from "./CampusSelector";

export default function CreatePost() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState<"lost" | "found">("lost");
    const [selectedCampus, setSelectedCampus] = useState("");
    const [dateLostFound, setDateLostFound] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const savedCampus = localStorage.getItem("foundu-campus");

        if (savedCampus) {
            setSelectedCampus(savedCampus);
        }
    }, []);

    const inputClass =
        "w-full rounded-xl border border-gray-300 bg-white p-3 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-200";

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!selectedCampus) {
            setError("Please select a campus.");
            return;
        }

        try {
            const savedPosts = localStorage.getItem("foundu-posts");
            const existingPosts = savedPosts ? JSON.parse(savedPosts) : [];

            if (!Array.isArray(existingPosts)) {
                throw new Error("Saved posts are not in the expected format.");
            }

            let imageData: string | undefined;

            if (image) {
                imageData = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();

                    reader.onload = () => {
                        if (typeof reader.result === "string") {
                            resolve(reader.result);
                        } else {
                            reject(new Error("Unable to read image."));
                        }
                    };

                    reader.onerror = () =>
                        reject(new Error("Unable to read image."));

                    reader.readAsDataURL(image);
                });
            }

            const postToSave = {
                id: crypto.randomUUID(),
                campus: selectedCampus,
                campus_id: selectedCampus,
                type,
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                image_data: imageData,
                date_recorded: dateLostFound,
                status: "active",
                user_name: "You",
                created_at: new Date().toISOString(),
            };

            const updatedPosts = [postToSave, ...existingPosts];

            localStorage.setItem(
                "foundu-posts",
                JSON.stringify(updatedPosts)
            );

            localStorage.setItem("foundu-campus", selectedCampus);

            setSuccess("Your post was created successfully!");

            // Redirect only after the post has been saved.
            router.push("/homepage");
        } catch (error) {
            console.error("Unable to save post:", error);

            setError(
                "Unable to save your post. Your image may be too large. Try a smaller image."
            );
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center bg-orange-50 px-5 py-10">
            {/* Page heading */}
            <div className="mb-6 flex w-full max-w-3xl flex-col rounded-xl border border-gray-100 bg-white p-6 text-center shadow-lg sm:p-8">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Create a Post
                </h1>

                <p className="mt-2 text-gray-600">
                    Help someone find their missing item or reunite an item
                    with its owner.
                </p>
            </div>

            {/* Original pink and red container */}
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center rounded-xl bg-[#f972a4] p-3 shadow-xl sm:p-5">
                <div className="h-full w-full rounded-xl bg-[#f99e66] p-4 shadow-inner sm:p-6">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full min-w-0 space-y-6 rounded-xl bg-white p-5 shadow-lg sm:p-6"
                    >
                        {/* Title */}
                        <div>
                            <label
                                htmlFor="title"
                                className="mb-2 block font-semibold text-gray-800"
                            >
                                Item Name
                            </label>

                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="e.g. Black backpack"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="description"
                                className="mb-2 block font-semibold text-gray-800"
                            >
                                Description
                            </label>

                            <textarea
                                id="description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                placeholder="Describe the item and any identifying details..."
                                rows={4}
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label
                                htmlFor="location"
                                className="mb-2 block font-semibold text-gray-800"
                            >
                                Location
                            </label>

                            <input
                                id="location"
                                type="text"
                                value={location}
                                onChange={(event) =>
                                    setLocation(event.target.value)
                                }
                                placeholder="e.g. Library, cafeteria, or parking lot"
                                className={inputClass}
                                required
                            />
                        </div>

                        {/* Details and image preview side by side */}
                        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
                            {/* Left: Lost/Found, campus, and date */}
                            <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-5 shadow-md">
                                {/* Lost or Found */}
                                <div>
                                    <label className="mb-2 block font-semibold text-gray-800">
                                        Is this item lost or found?
                                    </label>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setType("lost")}
                                            className={`flex-1 rounded-xl px-4 py-3 font-semibold shadow-sm transition ${
                                                type === "lost"
                                                    ? "bg-pink-500 text-white shadow-md"
                                                    : "border border-gray-300 bg-white text-gray-700 hover:bg-pink-50"
                                            }`}
                                        >
                                            Lost
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setType("found")}
                                            className={`flex-1 rounded-xl px-4 py-3 font-semibold shadow-sm transition ${
                                                type === "found"
                                                    ? "bg-[#ff914d] text-white shadow-md"
                                                    : "border border-gray-300 bg-white text-gray-700 hover:bg-orange-50"
                                            }`}
                                        >
                                            Found
                                        </button>
                                    </div>
                                </div>

                                {/* Campus selector */}
                                <div>
                                    <label className="mb-2 block font-semibold text-gray-800">
                                        Campus
                                    </label>

                                    <CampusSelector
                                        onCampusChange={setSelectedCampus}
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label
                                        htmlFor="dateLostFound"
                                        className="mb-2 block font-semibold text-gray-800"
                                    >
                                        Date Lost or Found
                                    </label>

                                    <input
                                        id="dateLostFound"
                                        type="date"
                                        value={dateLostFound}
                                        onChange={(event) =>
                                            setDateLostFound(event.target.value)
                                        }
                                        className={inputClass}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Right: Image upload and preview */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md">
                                <label
                                    htmlFor="image"
                                    className="mb-3 block font-semibold text-gray-800"
                                >
                                    Upload an Image
                                </label>

                                <input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setImage(
                                            event.target.files?.[0] ?? null
                                        )
                                    }
                                    required
                                    className="w-full min-w-0 rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-700 shadow-sm file:mr-2 file:rounded-lg file:border-0 file:bg-pink-100 file:px-3 file:py-2 file:font-semibold file:text-pink-700 hover:file:bg-pink-200"
                                />

                                {image ? (
                                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-inner">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt="Selected item preview"
                                            className="h-56 w-full rounded-lg object-contain"
                                        />

                                        <p className="mt-2 break-words text-center text-sm text-gray-500">
                                            {image.name}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => setImage(null)}
                                            className="mt-3 w-full rounded-lg border border-pink-200 px-3 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-50"
                                        >
                                            Remove Image
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-400">
                                        Your image preview will appear here
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <p
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        {/* Success message */}
                        {success && (
                            <p
                                role="status"
                                className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700"
                            >
                                {success}
                            </p>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            className="w-full rounded-xl bg-[#f99e66] px-4 py-3 font-semibold text-white shadow-md transition hover:bg-orange-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-[0.99]"
                        >
                            Publish Post
                        </button>

                        {/* Back button */}
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Go Back
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}