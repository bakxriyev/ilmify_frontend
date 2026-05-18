"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Eye, EyeOff, Smartphone, ArrowRight, GraduationCap, Users } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { motion } from "framer-motion"
import { toast } from "sonner"

type UserRole = "student" | "parent"

export default function LoginPage() {
  const [phone, setPhone] = useState("+998")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [role, setRole] = useState<UserRole>("student")

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const cleanedPhone = phone.replace(/\D/g, '')
    
    if (!cleanedPhone || cleanedPhone.length !== 12) {
      setError("Iltimos, to'liq telefon raqam kiriting (12 ta raqam)")
      setIsLoading(false)
      return
    }

    if (!password) {
      setError("Iltimos, parol kiriting")
      setIsLoading(false)
      return
    }

    try {
      const phoneToSend = `+${cleanedPhone}`
      const success = await login(phoneToSend, password, role === 'student' ? 'student' : 'parent')
      
      if (success) {
        toast.success("Muvaffaqiyatli kirish!")
        router.push("/dashboard")
      } else {
        setError("Kirish muvaffaqiyatsiz. Qayta urinib ko'ring.")
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || "Telefon raqam yoki parol noto'g'ri")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    value = value.replace(/[^\d+]/g, '')
    if (!value.startsWith('+')) {
      value = '+' + value.replace(/[^0-9]/g, '')
    }
    if (value.length > 13) {
      value = value.substring(0, 13)
    }
    if (value.length >= 4) {
      const countryCode = value.substring(0, 4)
      const rest = value.substring(4).replace(/\D/g, '')
      let formatted = countryCode
      if (rest.length > 0) formatted += ` (${rest.substring(0, 2)}`
      if (rest.length > 2) formatted += `) ${rest.substring(2, 5)}`
      if (rest.length > 5) formatted += `-${rest.substring(5, 7)}`
      if (rest.length > 7) formatted += `-${rest.substring(7, 9)}`
      setPhone(formatted)
    } else {
      setPhone(value)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-100">
      {/* 3D chiziqli fon */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                rgba(59,130,246,0.3) 0px,
                rgba(59,130,246,0.3) 1px,
                transparent 1px,
                transparent 20px
              ),
              repeating-linear-gradient(
                -45deg,
                rgba(99,102,241,0.2) 0px,
                rgba(99,102,241,0.2) 1px,
                transparent 1px,
                transparent 20px
              )
            `,
          }}
        />
        {/* Yengil doiraviy 3D soya */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo va nom (3D tekstli) */}
        <div className="text-center mb-8">
          <img src="./logo.jpg" className="w-66 h-66 mx-auto" alt="" />
        </div>

        {/* 3D Card */}
        <Card className="border-0 -mt-20 rounded-3xl bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15),0_10px_20px_rgba(59,130,246,0.1)] transform-gpu">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800 drop-shadow-sm">Hisobingizga kiring</h2>
              <p className="text-sm text-gray-500 mt-1">Telefon raqam va parolingizni kiriting</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Rol tanlash (3D tugmalar) */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 drop-shadow-sm">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Kim sifatida kirmoqchisiz?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl font-medium transition-all duration-200
                      shadow-[0_4px_6px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.1)]
                      active:shadow-inner active:translate-y-0.5
                      ${role === "student"
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.5),0_4px_12px_rgba(59,130,246,0.3)]"
                        : "bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span className="text-sm font-semibold">O‘quvchi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("parent")}
                    className={`flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl font-medium transition-all duration-200
                      shadow-[0_4px_6px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.1)]
                      active:shadow-inner active:translate-y-0.5
                      ${role === "parent"
                        ? "bg-purple-50 text-purple-700 border-2 border-purple-500 shadow-[0_0_0_1px_rgba(139,92,246,0.5),0_4px_12px_rgba(139,92,246,0.3)]"
                        : "bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-semibold">Ota-ona</span>
                  </button>
                </div>
              </div>

              {/* Telefon input (3D) */}
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1 drop-shadow-sm">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  Telefon raqamingiz
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="+998 (__) ___-__-__"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="h-12 text-base pl-12 bg-white border-2 border-gray-200 rounded-xl shadow-inner shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2),inset_0_2px_4px_rgba(0,0,0,0.05)] focus:border-blue-500 transition-all"
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🇺🇿</span>
                </div>
              </div>

              {/* Parol input (3D) */}
              <div>
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1 drop-shadow-sm">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  Parol
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Parolingiz"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-base pl-12 pr-10 bg-white border-2 border-gray-200 rounded-xl shadow-inner shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2),inset_0_2px_4px_rgba(0,0,0,0.05)] focus:border-blue-500 transition-all"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm shadow-sm">
                  {error}
                </div>
              )}

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-indigo-600 font-medium hover:underline drop-shadow-sm">
                  Parolni unutdingizmi?
                </Link>
              </div>

              {/* 3D Login tugma */}
              <Button
                type="submit"
                className={`w-full h-12 text-white font-bold rounded-xl shadow-[0_8px_15px_rgba(0,0,0,0.15)] active:shadow-[0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all ${
                  role === "student"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/40"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/40"
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Kutilmoqda...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Kirish <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6 drop-shadow-sm">
          Hisobingiz yo‘qmi?{" "}
          <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
            Administrator bilan bog‘laning
          </Link>
        </p>
      </motion.div>
    </div>
  )
}