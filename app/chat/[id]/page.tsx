import ItemChatView from "@/components/ItemChatView";
import Sidebar from "@/components/Sidebar";
import React from "react";

export default function MessagesPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <ItemChatView />
      </div>
    </div>
  );
}