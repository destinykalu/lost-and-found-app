
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CampusSelector from "./CampusSelector";
import { supabase } from "../lib/supabase";

export default function CreatePost() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"lost" | "found">("lost");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedCampus = localStorage.getItem("foundu-campus");

    if (savedCampus) {
      setSelectedCampus(savedCampus);
    }
  }, []);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      setImage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your image must be 5 MB or smaller.");
      event.target.value = "";
      setImage(null);
      return;
    }

    setImage(file);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !title.trim() ||
      !description.trim() ||
      !location.trim() ||
      !selectedCampus ||
      !date
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (date > new Date().toISOString().split("T")[0]) {
      setError("The date cannot be in the future.");
      return;
    }

    setIsSubmitting(true);

    let uploadedImagePath: string | null = null;

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Please sign in before publishing a post.");
        router.push("/login");
        return;
      }

      // Find the campus UUID using the selected campus name.
      const { data: campus, error: campusError } = await supabase
        .from("campuses")
        .select("id, name")
        .eq("name", selectedCampus)
        .single();

      if (campusError || !campus) {
        throw new Error(
          "We couldn't find that campus. Please select your campus again."
        );
      }

      let imageUrl: string | null = null;

      // Upload the image and save its public URL.
      if (image) {
        const extension = image.name.split(".").pop()?.toLowerCase() || "jpg";
        const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(imagePath, image, {
            contentType: image.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Image upload failed: ${uploadError.message}`
          );
        }

        uploadedImagePath = imagePath;

        const { data: publicImage } = supabase.storage
          .from("item-images")
          .getPublicUrl(imagePath);

        imageUrl = publicImage.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("items")
        .insert({
          campus_id: campus.id,
          type,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          date_recorded: date,
          image_url: imageUrl,
          status: "active",
          user_id: user.id,
        });

      if (insertError) {
        throw new Error(
          `Could not publish your post: ${insertError.message}`
        );
      }

      localStorage.setItem("foundu-campus", campus.name);

      setSuccess("Your post was published successfully!");

      router.push("/homepage");
      router.refresh();
    } catch (err) {
      console.error("Error creating post:", err);

      // Remove the uploaded image if saving the post failed.
      if (uploadedImagePath) {
        const { error: cleanupError } = await supabase.storage
          .from("item-images")
          .remove([uploadedImagePath]);

        if (cleanupError) {
          console.error(
            "Could not remove the uploaded image:",
            cleanupError.message
          );
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while publishing your post."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-orange-50 px-5 py-10">
      <div className="mb-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Create a Post
        </h1>
        <p className="mt-2 text-gray-600">
          Help reunite people with their lost belongings.
        </p>
      </div>

      <div className="w-full max-w-3xl rounded-3xl bg-[#f972a4] p-3 shadow-lg">
        <div className="rounded-2xl bg-[#f99e66] p-4 sm:p-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-5 shadow-md sm:p-8"
          >
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            <div className="mb-5">
              <label
                htmlFor="item-title"
                className="mb-2 block font-semibold text-gray-800"
              >
                Item Name
              </label>
              <input
                id="item-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Black backpack"
                className={inputClass}
                maxLength={150}
                required
              />
            </div>

            <div className="mb-5">
              <label
                htmlFor="item-description"
                className="mb-2 block font-semibold text-gray-800"
              >
                Description
              </label>
              <textarea
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the item and any identifying details..."
                className={inputClass}
                rows={4}
                maxLength={3000}
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="item-location"
                className="mb-2 block font-semibold text-gray-800"
              >
                Location
              </label>
              <input
                id="item-location"
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Where was it lost or found?"
                className={inputClass}
                maxLength={250}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <label className="mb-3 block font-semibold text-gray-800">
                  Post Type
                </label>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType("lost")}
                    aria-pressed={type === "lost"}
                    className={`rounded-full px-4 py-3 font-semibold transition ${
                      type === "lost"
                        ? "bg-pink-500 text-white shadow-md"
                        : "border border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
                    }`}
                  >
                    Lost
                  </button>

                  <button
                    type="button"
                    onClick={() => setType("found")}
                    aria-pressed={type === "found"}
                    className={`rounded-full px-4 py-3 font-semibold transition ${
                      type === "found"
                        ? "bg-[#ff914d] text-white shadow-md"
                        : "border border-orange-200 bg-white text-orange-600 hover:bg-orange-50"
                    }`}
                  >
                    Found
                  </button>
                </div>

                <div className="mb-5">
                  <label className="mb-2 block font-semibold text-gray-800">
                    Campus
                  </label>
                  <CampusSelector
                    onCampusChange={setSelectedCampus}
                  />
                </div>

                <div>
                  <label
                    htmlFor="item-date"
                    className="mb-2 block font-semibold text-gray-800"
                  >
                    Date Lost or Found
                  </label>
                  <input
                    id="item-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
                <label
                  htmlFor="item-image"
                  className="mb-3 block font-semibold text-gray-800"
                >
                  Upload Image
                </label>

                <p className="mb-4 text-sm text-gray-500">
                  Add a picture to help identify the item. Maximum size: 5 MB.
                </p>

                <input
                  id="item-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
                />

                {imagePreview && (
                  <div className="mt-5">
                    <img
                      src={imagePreview}
                      alt="Preview of selected item"
                      className="h-56 w-full rounded-xl border border-gray-200 object-contain"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);

                        const input = document.getElementById(
                          "item-image"
                        ) as HTMLInputElement | null;

                        if (input) {
                          input.value = "";
                        }
                      }}
                      className="mt-3 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 rounded-full border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Go Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-[#f99e66] px-5 py-3 font-semibold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Publishing..." : "Publish Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
