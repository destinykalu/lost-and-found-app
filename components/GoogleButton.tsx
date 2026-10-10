"use client";

import { supabase } from "../lib/supabase";

export default function GoogleButton() {
  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      console.error("Google sign-in error:", error.message);
      alert("Google sign-in failed. Please try again.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      Continue with Google
    </button>
  );
}