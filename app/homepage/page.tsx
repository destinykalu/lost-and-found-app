import React from 'react';
import Sidebar from '@/components/Sidebar';
import PostFeed from '@/components/PostFeed';

export default function Page() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <PostFeed />
      </main>
    </div>
  );
}