"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { UserIcon, EnvelopeIcon, KeyIcon, CameraIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setUser(user);
      // Load existing avatar from user metadata if it exists
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file || !user) return;

      // 1. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the newly uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 3. Save that URL directly to the user's auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;
      
      // Update the screen immediately
      setAvatarUrl(publicUrl);

    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Error uploading avatar!');
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#fdf8f4]">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-lg font-semibold text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#fdf8f4]">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-10">
        
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-[#f99e66] p-3 sm:p-4 shadow-lg">
          <div className="rounded-[1.5rem] bg-[#e65a98] p-2 sm:p-3">
            <div className="min-h-[70vh] rounded-xl bg-white p-6 sm:p-10">
              
              <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
                <button 
                  onClick={handleSignOut}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-200"
                >
                  Sign Out
                </button>
              </div>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                
                {/* Interactive Avatar Area */}
                <div className="flex flex-col items-center gap-3">
                  <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`group relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-[#e65a98] bg-[#ebd3d8] transition-all ${uploading ? 'opacity-70 cursor-not-allowed' : 'hover:border-pink-600'}`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-16 w-16 text-[#a3224f]" />
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <CameraIcon className="h-8 w-8 text-white" />
                    </div>

                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="text-xs font-bold text-white">Saving...</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs font-semibold text-gray-500">
                    Click to update
                  </p>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </div>

                {/* User Details */}
                <div className="flex w-full flex-col justify-center gap-4">
                  
                  <div className="rounded-xl border-2 border-orange-100 bg-orange-50 p-4">
                    <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-orange-800">
                      <EnvelopeIcon className="h-4 w-4" />
                      Email Address
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.email || "No email found"}
                    </p>
                  </div>

                  <div className="rounded-xl border-2 border-gray-100 bg-gray-50 p-4">
                    <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                      <KeyIcon className="h-4 w-4" />
                      Account ID
                    </p>
                    <p className="truncate text-sm font-medium text-gray-600">
                      {user?.id}
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-10 border-t border-gray-100 pt-8">
                <h2 className="mb-4 text-xl font-bold text-gray-800">Account Settings</h2>
                <p className="text-sm text-gray-500">
                  More settings and profile customization options can be added here!
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}