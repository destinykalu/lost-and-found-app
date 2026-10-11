"use client";
import React, { useState } from 'react'
import { MagnifyingGlassCircleIcon, XMarkIcon} from '@heroicons/react/24/outline';

interface SearchBarProps{
    query:string;
    onQueryChange: (value: string) => void;

}
export default function SearchBar({
    query,
    onQueryChange,
}: SearchBarProps) {
  return (
    <div className='w-full'>
        <h1 className=' text-pink-600 font-bold'>We're Finders not Keepers</h1>
        <input type='search'
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder='Search items, locations, descriptions' 
        className='w-full border rounded-2xl p-1 border-gray-300'/>

        {query && (
        <button type='button' onClick={() => onQueryChange("")}>
            <XMarkIcon />
        </button>
        )}
    </div>
    
  )
};
