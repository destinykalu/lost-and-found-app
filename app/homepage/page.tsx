import React from 'react'
import Login from "@/components/Sidebar";
import Sidebar from '@/components/Sidebar';
import PostFeed from '@/components/PostFeed';

export default function page() {
  return (
    <div className='min-h-screen border-2 border-white 
    max-w-[1400px] w-full mx-auto flex'>  
      <Sidebar />
      <PostFeed />
    </div>
 
  )
}
