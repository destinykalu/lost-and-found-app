import CreatePost from '@/components/CreatePost'
import Sidebar from '@/components/Sidebar'
import React from 'react'

export default function page() {
  return (
    <div className='min-h-screen border-2 border-white 
    max-w-[1400px] w-full mx-auto flex'>
        <Sidebar />
        <CreatePost />
    </div>
  )
}
