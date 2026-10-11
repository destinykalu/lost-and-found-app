"use client";

import React, { useState } from "react";
import CampusSelector from "./CampusSelector";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [selectedCampus, setSelectedCampus] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!selectedCampus) {
      alert("Please select your campus first.");
      return;
    }

    setIsLoggingIn(true);

    // Save the selected campus before redirecting to Google.
    localStorage.setItem("userCampus", selectedCampus);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/homepage`,
      },
    });

    if (error) {
      console.error("Login failed:", error.message);
      alert("Login failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#faa46e] p-4 sm:p-6">
      <div className="w-full max-w-[600px] rounded-xl bg-[#f972a4] p-3 sm:p-5">
        <div className="flex w-full flex-col items-center rounded-xl bg-white px-4 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex w-full flex-col items-center justify-center sm:mb-8">
            <img
              src="/images/logo.png"
              alt="FoundU logo"
              className="h-auto w-full max-w-[450px] object-contain"
            />

            <h1 className="text-center font-bold text-pink-600">
              We're Finders not Keepers
            </h1>
          </div>

          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <CampusSelector onCampusChange={setSelectedCampus} />

            <button
              className="flex w-full items-center justify-center gap-3 rounded-full bg-[#faa46e] px-4 py-3 font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50"
              type="button"
              disabled={isLoggingIn}
              onClick={handleLogin}
            >
              {!isLoggingIn && (
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt=""
                  className="h-5 w-5 rounded-full bg-white p-0.5"
                />
              )}
              {isLoggingIn ? "Redirecting..." : "Continue with Google"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}