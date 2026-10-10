import React from 'react'
import Image from "next/image";
import { 
  HomeIcon,
  HashtagIcon,
  BellIcon,
  InboxIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon


} from "@heroicons/react/24/outline"

export default function Sidebar() {
  return (
    <nav className='hidden sm:flex flex-col sticky top-0'>
      <div className='py-3'>
        <Image src={'/images/logo.png'} width={130} height={130} alt='logo' />
      </div>
      <ul>
        <SidebarLink Icon= {HomeIcon} text= "Home"/>
        <SidebarLink Icon= {HashtagIcon} text= "My Post"/>
        <SidebarLink Icon= {BellIcon} text= "Notifications"/>
        <SidebarLink Icon= {ChatBubbleBottomCenterTextIcon} text= "Chat"/>
        <SidebarLink Icon= {UserIcon} text= "My Profile"/>
       
     
        



      </ul>
      <div>
        User Info
      </div>
    </nav>
  )
}
 function SidebarLink({ text, Icon}){
    return(
      <li className='flex items-center text-xl mb-6 space-x-5 '>
        <Icon className= "h-7" />
        <span className='m:block'>{text}</span>
      </li>
    )
 }