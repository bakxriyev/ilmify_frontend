"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, Smartphone, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

interface ProfileDropdownProps {
  userData: any          // combined student / user data
  isLoading: boolean
  fullName: string
  avatarSrc: string
  onLogout: () => void
}

export function ProfileDropdown({
  userData,
  isLoading,
  fullName,
  avatarSrc,
  onLogout,
}: ProfileDropdownProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleNavigation = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="outline-none focus:ring-2 focus:ring-yellow-400 rounded-full">
          <Avatar className="h-10 w-10 md:h-14 md:w-14 ring-2 ring-yellow-400 ring-offset-2 transition-transform hover:scale-105">
            <AvatarImage src={avatarSrc} alt={fullName} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-xl">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-2"
      >
        <DropdownMenuLabel className="font-normal p-3">
  <div className="flex items-center gap-3">
    <Avatar className="h-12 w-12">
      <AvatarImage src={avatarSrc} alt={fullName} />
      <AvatarFallback className="bg-gray-300">{initials}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col">
      <p className="text-sm font-bold text-gray-900">
        {isLoading ? "Loading..." : fullName}
      </p>
      <p className="text-xs text-gray-500">
        {userData?.group_students?.[0]?.group?.name 
          ? `${userData.group_students[0].group.name} (${userData.group_students[0].group.level?.name || 'No level'})` 
          : "Student"}
      </p>
    </div>
  </div>
</DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-200" />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => handleNavigation("/dashboard/profile")}
            className="rounded-xl py-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <User className="mr-3 h-5 w-5 text-gray-500" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleNavigation("/dashboard/settings")}
            className="rounded-xl py-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
          >
            <Settings className="mr-3 h-5 w-5 text-gray-500" />
            <span>Settings</span>
          </DropdownMenuItem>
     
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-gray-200" />

        <DropdownMenuItem
          onClick={onLogout}
          className="rounded-xl py-3 cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}