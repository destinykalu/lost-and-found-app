
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HomeIcon,
  HashtagIcon,
  BellIcon,
  InboxIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  return (
    <nav className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-[#ff914d] p-2 font-bold text-white sm:w-56 sm:p-3">
      <div className="relative h-full">
        <div className="py-3">
          <Image
            src="/images/logo.png"
            width={130}
            height={130}
            alt="logo"
          />
        </div>

        <ul>
          <SidebarLink Icon={HomeIcon} text="Home" href="/homepage" />
          <SidebarLink Icon={HashtagIcon} text="Create Post" href="/newPost" />
          <SidebarLink Icon={BellIcon} text="Notifications" href="/newPost" />
          <SidebarLink Icon={InboxIcon} text="Chat" href="/newPost" />
          <SidebarLink Icon={UserIcon} text="My Profile" href="/newPost" />
        </ul>

        <div className="absolute bottom-0">User Info</div>
      </div>
    </nav>
  );
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
