"use client";
import React from 'react'
import { useRouter } from "next/navigation";
import GoogleButton from "./GoogleButton";
import CampusSelector from "./CampusSelector";
import { useState } from "react";




export default function Login() {
    const router = useRouter();
    const [selectedCampus, setSelectedCampus] = useState("");

    
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#ff914d] p-4 sm:p-6">
        {/* Pink outer box */}
        <div className="w-full max-w-[600px] rounded-xl bg-[#ff1fa9] p-3 sm:p-5">

            {/* White inner box */}
            <div className="flex w-full flex-col items-center rounded-xl bg-white px-4 py-6 sm:px-8 sm:py-8">

            {/* Logo */}
            <div className="mb-6 flex w-full justify-center sm:mb-8">
                <img
                src="/images/logo.png"
                alt="FoundU logo"
                className="h-auto w-full max-w-[450px] object-contain"
                />
            </div>

            {/* Name and college fields */}
            <div className="flex w-full max-w-sm flex-col items-center gap-4">

                <GoogleButton></GoogleButton>

                
               <CampusSelector onCampusChange={setSelectedCampus} />

                <button
                className="w-full rounded-full bg-[#ff914d] px-4 py-3 font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                type="button"
                onClick={() => {
                    if(!selectedCampus){
                        alert("Please select your campus first.");
                        return;
                    }

                    router.push("/homepage")}}>
                Continue
                </button>

            </div>
            </div>
        </div>
        </main>
    
  )
}
