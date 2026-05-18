"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Home, BookOpen, Award, TrendingUp, Plus, User, LogOut, ShoppingBag, MessageSquare, Users, School, Heart, Building } from "lucide-react"
import { Logo } from "@/components/ui/Logo"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

const baseMenuItems = [
  { icon: Home,       label: "Home",    href: "/dashboard" },
  { icon: MessageSquare, label: "Chat", href: "/dashboard/chat" },
  { icon: User,       label: "Profile", href: "/dashboard/profile" },
]

const studentItems = [
  { icon: Award,      label: "Marks",   href: "/dashboard/marks" },
  { icon: Plus,       label: "Extra",   href: "/dashboard/extra-lesson" },
  { icon: ShoppingBag, label: "Shop",  href: "/dashboard/shop" },
  { icon: TrendingUp, label: "Ranking", href: "/dashboard/ranking" },
]

const teacherItems = [
  { icon: School,     label: "Guruhlarim", href: "/dashboard" },
  { icon: Award,      label: "Baholar",   href: "/dashboard/marks" },
]

const parentItems = [
  { icon: Heart,      label: "Farzandlarim", href: "/dashboard" },
  { icon: Award,      label: "Davomat",     href: "/dashboard/marks" },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isStudent, isTeacher, isParent } = useAuth()
  const [centerInfo, setCenterInfo] = useState<{ name: string; logo: string | null } | null>(null)

  useEffect(() => {
    const loadCenter = async () => {
      try {
        const userRaw = localStorage.getItem('user')
        if (!userRaw) return
        const userData = JSON.parse(userRaw)
        if (userData.center) {
          setCenterInfo({ name: userData.center.name, logo: userData.center.logo })
          return
        }
        const centerId = userData.center_id || userData.group?.center_id
        if (centerId) {
          const token = localStorage.getItem('token')
          const res = await fetch(`${API_URL}/education-centers/${centerId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          if (res.ok) {
            const c = await res.json()
            setCenterInfo({ name: c.name, logo: c.logo })
          }
        }
      } catch {}
    }
    loadCenter()
  }, [])

  let menuItems = [...baseMenuItems]
  if (isStudent) menuItems = [...baseMenuItems, ...studentItems]
  else if (isTeacher) menuItems = [...baseMenuItems, ...teacherItems]
  else if (isParent) menuItems = [...baseMenuItems, ...parentItems]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex sticky top-0 h-screen w-72 shrink-0 bg-gray-800 text-white z-40 flex-col rounded-r-3xl shadow-xl">
        <div className="p-8">
          {centerInfo ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-700 flex items-center justify-center shrink-0">
                {centerInfo.logo ? (
                  <img src={`${API_URL}/uploads/centers/${centerInfo.logo}`}
                    className="w-full h-full object-cover" alt={centerInfo.name} />
                ) : (
                  <Building className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white text-sm truncate">{centerInfo.name}</span>
                <span className="text-[10px] text-blue-300">O'quv markazi</span>
              </div>
            </div>
          ) : (
            <Logo size="md" />
          )}
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1 px-4">
          {menuItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-4 px-6 py-3.5 rounded-2xl text-base font-medium
                  transition-all duration-200
                  ${isActive
                    ? "bg-gray-700 text-white border-r-4 border-yellow-400"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700 rounded-2xl py-3"
            onClick={logout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile bottom tab bar (xuddi shunday filter) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 rounded-t-3xl shadow-2xl" />
        <ul className="relative flex items-end justify-around px-4 pt-2 pb-6">
          {menuItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href
            const isExtra  = href === "/dashboard/extra-lesson"

            if (isExtra) {
              return (
                <li key={href} className="flex flex-col items-center -mt-7">
                  <Link href={href} className="flex flex-col items-center gap-1">
                    <span className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300
                      ${isActive ? "bg-yellow-400 scale-110" : "bg-gray-800 hover:bg-gray-700"}`}>
                      <Icon className={`h-7 w-7 ${isActive ? "text-gray-900" : "text-white"}`} />
                    </span>
                    <span className={`text-[10px] font-semibold ${isActive ? "text-yellow-500" : "text-gray-500"}`}>
                      {label}
                    </span>
                  </Link>
                </li>
              )
            }

            return (
              <li key={href}>
                <Link href={href} className="flex flex-col items-center gap-1 px-2 py-1">
                  <span className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200
                    ${isActive ? "bg-gray-800 shadow-md scale-110" : "bg-transparent"}`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-yellow-400" : "text-gray-400"}`} />
                  </span>
                  <span className={`text-[10px] font-semibold ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                    {label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}