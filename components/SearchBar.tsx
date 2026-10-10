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
    <div>
        <h1>Find Your Item</h1>
        <input type='search'
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder='Search items, descriptions, or locations...' />

        {query && (
        <button type='button' onClick={() => onQueryChange("")}>
            <XMarkIcon />
        </button>
        )}
    </div>
    
  )
};
