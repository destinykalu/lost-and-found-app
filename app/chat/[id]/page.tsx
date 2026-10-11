
"use client";

import React from "react";
import { useParams } from "next/navigation";
import ItemChatView from "@/components/ItemChatView";
import Sidebar from "@/components/Sidebar";

export default function MessagesPage() {
  const params = useParams<{ id: string }>();
  const chatId = String(params?.id ?? "");

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="min-w-0 flex-1">
        {chatId ? (
          <ItemChatView chatId={chatId} />
        ) : (
          <div className="p-8 text-center text-gray-600">
            Loading conversation...
          </div>
        )}
      </div>
    </div>
  );
}
