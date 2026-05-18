// app/dashboard/layout.tsx
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { toast } from "sonner"
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, role, checkCurrentDevice, logout } = useAuth()
  const router = useRouter()
  const [isDeviceValid, setIsDeviceValid] = useState<boolean | null>(null)
  const pathname = usePathname();
  
  const isExercises = pathname?.startsWith('/dashboard/exercises');
  const isStudent = role === 'student';

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (!isStudent) {
      setIsDeviceValid(true)
      return
    }

    checkCurrentDevice(user.id)
      .then((isValid) => {
        if (!isValid) {
          toast.error("Hisobingiz boshqa qurilmada faollashtirilgan. Qayta kiring.")
          logout()
          return
        }
        setIsDeviceValid(true)
      })
      .catch(() => {
        setIsDeviceValid(true)
      })
  }, [user, isLoading, isStudent])

  useEffect(() => {
    if (!user || !isDeviceValid || !isStudent) return

    const interval = setInterval(() => {
      checkCurrentDevice(user.id)
        .then((isValid) => {
          if (!isValid) {
            toast.error("Hisobingiz boshqa qurilmada faollashtirilgan.")
            logout()
          }
        })
        .catch(console.error)
    }, 30_000)

    return () => clearInterval(interval)
  }, [user, isDeviceValid, isStudent])

  if (isLoading || isDeviceValid === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || !isDeviceValid) return null

  /* ── Layout ── */
  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isExercises && <Sidebar />}
      <div className={`flex flex-col flex-1 min-w-0 min-h-screen ${!isExercises ? '' : ''}`}>
        {!isExercises && <Header />}
        <main className={`flex-1 overflow-auto ${!isExercises ? 'pb-24 md:pb-0' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}