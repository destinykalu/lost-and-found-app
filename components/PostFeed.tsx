"use client";
import React, { useState } from 'react'
import SearchBar from './SearchBar'

import { useRouter } from "next/navigation";

export default function PostFeed() {
    const[query, setQuery] = useState('');
    const router = useRouter();
  return (
    <div className='flex-grow border-2 border-black bg-white'>
        <div className='bg-white'>
            <h1>FoundU</h1>
            <SearchBar query={query} onQueryChange={setQuery}></SearchBar>
          
            <button
                type="button"
                onClick={() => router.push("/newPost")}
                className="w-full rounded-full bg-[#ff914d] px-4 py-3 font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                Create New Post
                </button>
            
        </div>
        
        
    </div>
  )
}
