"use client"
import React from 'react'
import Image from "next/image";
import { usePathname } from 'next/navigation';
import { useRouter } from "next/navigation";

import {
  HomeIcon,
  HashtagIcon,
  BellIcon,
  InboxIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon
} from "@heroicons/react/24/outline"
import Link from 'next/link';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className='sticky top-0 flex h-screen w-16 shrink-0 flex-col p-2 sm:w-56 sm:p-3 bg-[#f99e66] text-white font-bold'>
      <div className='relative h-full'>
        <div className='py-3'>
          <Image src={'/images/logo.png'} width={130} height={130} alt='logo' />
        </div>
        <ul>
          <SidebarLink Icon={HomeIcon} text="Home" href="/homepage"/>
          <SidebarLink Icon={HashtagIcon} text="Create Post" href="/newPost"/>
          <SidebarLink Icon={BellIcon} text="Notifications" href="/notifications"/>
          <SidebarLink
            Icon={ChatBubbleBottomCenterTextIcon}
            text="Chat"
            href="/chat"
          />
          <SidebarLink Icon={UserIcon} text="My Profile" href="/profile"/>
        </ul>

      <div className="absolute bottom-0 left-0 w-full p-4 text-center">
        <button
          onClick={() => router.push("/")}
          className="font-semibold text-pink-600 hover:text-pink-700 bg-white p-3 rounded-2xl"
        >
          Switch User
        </button>
      </div>

      </div>
    </nav>
  )
}

interface SidebarLinkProps {
  text: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

function SidebarLink({ text, Icon, href }: SidebarLinkProps) {
  return (
    <li className="mb-6 flex items-center p-2.5 text-xl">
      <Link href={href} className="flex items-center space-x-5">
        <Icon className="h-7 shrink-0" />
        <span className="hidden sm:inline">{text}</span>
      </Link>
    </li>
  );
}