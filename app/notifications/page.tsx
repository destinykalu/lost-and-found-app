"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { ChatBubbleLeftEllipsisIcon, MapPinIcon } from "@heroicons/react/24/outline";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState<any[]>([]);
  const [campusAlerts, setCampusAlerts] = useState<any[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch recent chats where you are a participant
      const { data: chats } = await supabase
        .from("chats")
        .select("id, item_id")
        .or(`finder_id.eq.${user.id},claimant_id.eq.${user.id}`);

      if (chats && chats.length > 0) {
        const chatIds = chats.map((c) => c.id);
        
        // Find recent messages in those chats sent by OTHER people
        const { data: messages } = await supabase
          .from("messages")
          .select("*, chats(item_id)")
          .in("chat_id", chatIds)
          .neq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        setMessageAlerts(messages || []);
      }

      // 2. Fetch new items in your user's campus
      const { data: items } = await supabase
        .from("items")
        .select("*")
        .eq("location", "Georgia State University")
        .neq("user_id", user.id) 
        .order("date_recorded", { ascending: false })
        .limit(5);

      setCampusAlerts(items || []);
      setLoading(false);
    }

    loadNotifications();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-[#fdf8f4]">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-lg font-semibold text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#fdf8f4]">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-4 sm:p-10">
        
        {/* The Outer Orange Border */}
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-[#f99e66] p-3 sm:p-4 shadow-lg">
          
          {/* The Inner Pink Border */}
          <div className="rounded-[1.5rem] bg-[#e65a98] p-2 sm:p-3">
            
            {/* The White Content Area */}
            <div className="min-h-[70vh] rounded-xl bg-white p-6 sm:p-10">
              
              <h1 className="mb-8 text-3xl font-extrabold text-gray-900">Notifications</h1>

              <section className="mb-10">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
                  <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-gray-500" />
                  New Messages
                </h2>
                {messageAlerts.length === 0 ? (
                  <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm italic text-gray-500">
                    No new messages at this time.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messageAlerts.map((msg) => (
                      <Link 
                        key={msg.id} 
                        href={`/chat/${msg.chat_id}`}
                        className="group flex flex-col justify-center rounded-xl border-2 border-transparent bg-[#ebd3d8] p-4 transition-all hover:border-[#d69fb0] hover:shadow-sm"
                      >
                        <p className="text-sm font-extrabold text-[#a3224f]">
                          New message received!
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-gray-700">
                          "{msg.content}"
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
                  <MapPinIcon className="h-6 w-6 text-[#a3224f]" />
                  New at Your Campus
                </h2>
                {campusAlerts.length === 0 ? (
                  <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm italic text-gray-500">
                    No new items reported nearby.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {campusAlerts.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl border-2 border-transparent bg-orange-50 p-4 transition-all hover:border-orange-300">
                        <div>
                          <span className={`mb-1 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                            item.type === 'lost' ? 'bg-[#ebd3d8] text-[#a3224f]' : 'bg-green-100 text-green-700'
                          }`}>
                            {item.type}
                          </span>
                          <p className="text-base font-bold text-gray-900">{item.title}</p>
                        </div>
                        <Link 
                          href={`/homepage`} 
                          className="rounded-full bg-[#f99e66] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}