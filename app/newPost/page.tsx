import CreatePost from "@/components/CreatePost";
import Sidebar from "@/components/Sidebar";
import React from "react";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <CreatePost />
      </main>
    </div>
  );
}