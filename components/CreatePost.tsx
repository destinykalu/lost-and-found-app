"use client";
import React, { useState } from 'react'
import CampusSelector from './CampusSelector';

export default function CreatePost() {
    const[title, setTitle] = useState('');
    const[description, setDescription] = useState('');
    const[location, setLocation] = useState('');
    const[type, setType] = useState<'lost'|'found'>('lost');
    const[error, setError] =useState('');
    const [selectedCampus, setSelectedCampus] = useState("");
    const [image,setImage] = useState<File |null>(null);
  

    // We'll add our post-creation logic here.
    const newPost ={
        title,
        description,
        location,
        type,
        campus_id: selectedCampus,
        

    };
      function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
         event.preventDefault();
         if (!title.trim() || !description.trim()|| !location.trim()){
            setError("Please fill out all fields before submitting your post.");
            return;
         }
         
        console.log(newPost);
        setTitle('');
        setDescription('');
        setLocation('')
       
        

}
  return (
    <div className='flex flex-col min-h-screen w-full items-center justify-center p-5 bg-orange-200'>
        {/*Header */}
        <div className='flex flex-col p-5 text-center bg-white rounded-xl mb-5'>
            <h1 className='font-extrabold text-3xl p-2'>Let's Bring Lost Items Home</h1>
            <p className='font-extralight'>Every post makes a difference. Whether you've lost something important or found something that belongs to someone else, share it with the community!</p>
        </div>
        {/*Form Container */}
        <div className=' w-full bg-[#ff1fa9] max-w-screen mx-auto flex flex-col items-center p-3 sm:p-4 rounded-xl '>
            <div className=' w-full  h-full bg-red-400 rounded-xl p-4'> 
            <h1 className='flex justify-center font-extrabold text-3xl text-white items-center p-2'>PostIt</h1>


            <div className="w-full min-w-0 rounded-xl bg-white p-6">
                
                <form onSubmit={handleSubmit}
                className="flex w-full min-w-0 flex-col gap-4">
                {error && <p>{error}</p>}

                 <label
                    htmlFor="image"
                    className="mb-2 block text-sm font-medium text-gray-700"
                    >
                    Item Image
                </label>
                <input 
                    id='image'
                    type='file' 
                    accept='image/*'
                    onChange={(event)=> setImage(event.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-dashed border-gray-300 p-3"
                    />
                <div className='flex flex-row gap-5 items-center'>
                    
                    {image && (
                        <div className="mt-3 w-full">
                            <p className="mb-2 text-sm font-medium text-gray-700">
                            Image preview
                            </p>

                            <img
                            src={URL.createObjectURL(image)}
                            alt="Preview of selected item"
                            className="h-48 w-48 rounded-xl border border-gray-200 object-cover"
                            />

                        </div>
                    )}
                    <div className='w-full'>
                         <label
                            htmlFor="lost-or-found"
                            className="mb-2 block text-sm font-medium text-gray-700"
                            >
                            Lost or Found?
                        </label>
                         <select 
                            id='lost-or-found'
                            value={type}
                            onChange={(event)=> setType(event.target.value)} 
                            className='w-full rounded-xl border border-gray-300 p-3'>
                            <option value='lost'>Lost</option>
                            <option value='found'>Found</option>
                        
                        </select>
                        <CampusSelector onCampusChange={setSelectedCampus} />

                    </div>
                   

                </div>
                
                <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium text-gray-700"
                    >
                    Title
                </label>
                <input
                id='title'
                value={title}
                onChange={(event)=> setTitle(event.target.value)}
                placeholder='Enter item name'
                className='w-full rounded-xl border border-gray-300 p-3'
                />
                 <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                    >
                    Description
                </label>
                <textarea
                id='description'
                    value={description}
                    onChange={(event)=> setDescription(event.target.value)}
                    placeholder='Describe the item'
                    className='w-full rounded-xl border border-gray-300 p-3'
                />
                <label
                    htmlFor="location"
                    className="mb-2 block text-sm font-medium text-gray-700"
                    >
                    Location
                </label>
                <input
                    id='location'
                    value={location}
                    onChange={(event)=> setLocation(event.target.value)}
                    placeholder='Enter where this item was lost/found?'
                    className='w-full rounded-xl border border-gray-300 p-3'
                    />

        
                <button type='submit' className='w-full rounded-xl border border-gray-300 p-3'>Publish Post</button>


        </form>


            </div>
            
        </div>
        </div>
        
        
        
    </div>
  )
}

