"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState, useRef, useCallback } from "react"
import { api, TeacherGroup } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import {
  Smartphone, Mail, MapPin, BookOpen, Phone, School, Users, Wallet, TrendingUp,
  GraduationCap, UserCheck, Camera, Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle,
  HeartHandshake, Star, Sparkles, Award, ChevronRight, Save, Upload
} from 'lucide-react'
import Link from "next/link"
import { toast } from "sonner"

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

export default function ProfilePage() {
  const { user, isTeacher, isStudent, isParent } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>("")
  const [savingPhoto, setSavingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)

  const photoFolder = isTeacher ? 'teachers' : isParent ? 'parents' : 'students'

  const getPhotoUrl = useCallback((photo: string | null | undefined) => {
    if (!photo) return ""
    if (photo.startsWith("http")) return photo
    if (photo.startsWith("blob:")) return photo
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${photoFolder}/${photo}`
  }, [photoFolder])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      setLoading(true)
      try {
        if (isTeacher) {
          const [groupsData] = await Promise.all([
            api.getTeacherGroups(Number(user.id)),
          ])
          setProfileData({
            ...user,
            teacher_type: (user as any).teacher_type,
            gmail: (user as any).gmail,
          })
          setTeacherGroups([...(groupsData.main_groups || []), ...(groupsData.support_groups || [])])
          if ((user as any).photo) {
            setPhotoPreview(getPhotoUrl((user as any).photo))
          }
        } else if (isParent) {
          const [parentData, childrenData] = await Promise.all([
            api.getParentById(Number(user.id)).catch(() => user),
            api.getParentChildren(Number(user.id)).catch(() => []),
          ])
          setProfileData(parentData)
          setChildren(childrenData)
          if (parentData?.photo) {
            setPhotoPreview(getPhotoUrl(parentData.photo))
          }
        } else {
          const data = await api.getStudentById(user.id)
          setProfileData(data)
          const g = data.group_students?.[0]?.group || data.group
          if (g?.photo) {
            setPhotoPreview(getPhotoUrl(g.photo))
          } else if (data.photo) {
            setPhotoPreview(getPhotoUrl(data.photo))
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err)
        toast.error("Profil ma'lumotlarini yuklashda xatolik")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id, isTeacher, isParent, getPhotoUrl])

  // ---- Photo Upload ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const blobUrl = URL.createObjectURL(file)
    setPhotoPreview(blobUrl)
  }

  const uploadPhoto = async () => {
    if (!photoFile || !user?.id) return
    setSavingPhoto(true)
    try {
      const fd = new FormData()
      fd.append("photo", photoFile, photoFile.name)
      if (isTeacher) {
        await api.updateTeacher(user.id.toString(), fd)
      } else if (isParent) {
        await api.updateParent(user.id.toString(), fd)
      } else {
        await api.updateStudent(user.id.toString(), fd)
      }
      toast.success("Rasm muvaffaqiyatli yangilandi")
      setPhotoFile(null)
    } catch (err) {
      toast.error("Rasmni saqlashda xatolik")
    } finally {
      setSavingPhoto(false)
    }
  }

  // ---- Password Change ----
  const changePassword = async () => {
    if (!user?.id) return
    if (newPassword.length < 4) {
      toast.error("Yangi parol kamida 4 belgidan iborat bo'lishi kerak")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Yangi parol va tasdiqlash mos kelmadi")
      return
    }
    setSavingPassword(true)
    try {
      if (isTeacher) {
        await api.changeTeacherPassword(user.id.toString(), { new: newPassword })
      } else if (isParent) {
        await api.changeParentPassword(user.id.toString(), { new: newPassword })
      } else {
        await api.changePassword(user.id.toString(), { current: currentPassword || undefined, new: newPassword })
      }
      toast.success("Parol muvaffaqiyatli yangilandi")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error("Parolni o'zgartirishda xatolik. Eski parolni tekshiring")
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  const fullName = profileData
    ? `${profileData.first_name ?? ""} ${profileData.last_name ?? ""}`.trim()
    : "Foydalanuvchi"
  const initials = fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  const roleLabel = isTeacher ? "O'qituvchi" : isParent ? "Ota-ona" : "O'quvchi"
  const roleIcon = isTeacher ? GraduationCap : isParent ? HeartHandshake : Star
  const RoleIcon = roleIcon

  // Student specific
  const gs = profileData?.group_students?.[0]
  const group = gs?.group || profileData?.group
  const level = group?.level?.name ?? group?.level?.title ?? ""
  const groupName = group?.name ?? ""
  const mainTeacher = group?.mainTeacher
  const supportTeacher = group?.supportTeacher

  // Teacher specific
  const totalStudents = teacherGroups.reduce((s, g) => s + (g.student_count || 0), 0)
  const totalIncome = teacherGroups.reduce((s, g) => s + ((g.kp || 0) * (g.student_count || 0)), 0)

  // Parent specific
  const childrenCount = children?.length || 0

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6 pb-24 md:pb-6">
      {/* ==================== HEADER ==================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/[0.03] rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white/50 shadow-xl ring-2 ring-white/30">
              <AvatarImage src={photoPreview} alt={fullName} />
              <AvatarFallback className="bg-gradient-to-br from-violet-600 to-pink-600 text-white text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all hover:scale-110"
              title="Rasmni o'zgartirish"
            >
              <Camera className="h-4 w-4 text-purple-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{fullName}</h1>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                <RoleIcon className="h-3 w-3 mr-1" />
                {roleLabel}
              </Badge>
            </div>
            <p className="text-white/70 text-sm mt-1">
              {profileData?.phone_number && (
                <span className="flex items-center gap-1 justify-center sm:justify-start">
                  <Smartphone className="h-3.5 w-3.5" />
                  {profileData.phone_number}
                </span>
              )}
            </p>
            {isStudent && group && (
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                <Badge className="bg-white/15 text-white/90 border-0 backdrop-blur-sm text-xs">
                  <School className="h-3 w-3 mr-1" /> {groupName}
                </Badge>
                {level && (
                  <Badge className="bg-white/15 text-white/90 border-0 backdrop-blur-sm text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" /> {level}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Photo save button */}
        {photoFile && (
          <div className="relative z-10 mt-4 flex justify-center sm:justify-start">
            <Button
              size="sm"
              onClick={uploadPhoto}
              disabled={savingPhoto}
              className="bg-white text-purple-700 hover:bg-purple-50 shadow-lg border-0"
            >
              {savingPhoto ? (
                <div className="h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Yangi rasmni saqlash
            </Button>
          </div>
        )}
      </div>

      {/* ==================== TABS ==================== */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full sm:w-auto bg-white border shadow-sm p-1 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <GraduationCap className="h-4 w-4 mr-2" />
            Ma'lumotlar
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Lock className="h-4 w-4 mr-2" />
            Xavfsizlik
          </TabsTrigger>
          <TabsTrigger value="activities" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md">
            <Award className="h-4 w-4 mr-2" />
            Faoliyat
          </TabsTrigger>
        </TabsList>

        {/* ==================== OVERVIEW TAB ==================== */}
        <TabsContent value="overview">
          {isTeacher ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <School className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{teacherGroups.length}</p>
                      <p className="text-xs text-white/80">Guruhlar</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{totalStudents}</p>
                      <p className="text-xs text-white/80">O'quvchilar</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{totalIncome.toLocaleString()}</p>
                      <p className="text-xs text-white/80">Oylik daromad</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-orange-700 text-white border-0 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">
                        {teacherGroups.filter((g: any) => String(g.teacher_id) === String(user?.id)).length}
                      </p>
                      <p className="text-xs text-white/80">Asosiy guruh</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Info */}
              <Card className="border-0 shadow-lg bg-white">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-3 rounded-t-xl">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Shaxsiy ma'lumotlar
                  </h2>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-900 text-sm">{profileData?.gmail || profileData?.email || "Kiritilmagan"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Telefon</p>
                        <p className="font-medium text-gray-900 text-sm">{profileData?.phone_number || "Kiritilmagan"}</p>
                      </div>
                    </div>
                  </div>
                  <Badge className={`border-0 ${(profileData as any)?.teacher_type === 'MAIN_TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {(profileData as any)?.teacher_type === 'MAIN_TEACHER' ? "Asosiy o'qituvchi" : "Yordamchi o'qituvchi"}
                  </Badge>
                </CardContent>
              </Card>

              {/* Groups */}
              {teacherGroups.length > 0 && (
                <Card className="border-0 shadow-lg bg-white">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-5 py-3 rounded-t-xl">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <School className="h-4 w-4" /> Guruhlarim ({teacherGroups.length})
                    </h2>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {teacherGroups.map((g) => {
                      const isMain = String(g.teacher_id) === String(user?.id)
                      const income = (g.kp || 0) * (g.student_count || 0)
                      return (
                        <Link href={`/dashboard/marks?groupId=${g.id}`} key={g.id}>
                          <div className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-md cursor-pointer ${isMain ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMain ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                <School className={`h-5 w-5 ${isMain ? 'text-blue-600' : 'text-gray-500'}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                                <p className="text-xs text-gray-500">{g.student_count || 0} o'quvchi{g.room ? ` • ${g.room.name}` : ''}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-emerald-600">{income.toLocaleString()} so'm</p>
                              <p className="text-xs text-gray-400">{g.kp ? `${Number(g.kp).toLocaleString()} so'm/kp` : '-'}</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : isParent ? (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-pink-500 to-rose-600 text-white border-0 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <HeartHandshake className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{childrenCount}</p>
                      <p className="text-xs text-white/80">Farzandlar</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white border-0 shadow-lg">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{children?.filter((c: any) => c.group_students?.[0]?.group).length || 0}</p>
                      <p className="text-xs text-white/80">Guruhda</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Info */}
              <Card className="border-0 shadow-lg bg-white">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-3 rounded-t-xl">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Shaxsiy ma'lumotlar
                  </h2>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telefon</p>
                      <p className="font-medium text-gray-900 text-sm">{profileData?.phone_number || "Kiritilmagan"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Children */}
              {children && children.length > 0 && (
                <Card className="border-0 shadow-lg bg-white">
                  <div className="bg-gradient-to-r from-pink-600 to-rose-700 px-5 py-3 rounded-t-xl">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <HeartHandshake className="h-4 w-4" /> Farzandlarim ({childrenCount})
                    </h2>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {children.map((child: any) => {
                      const childGroup = child.group_students?.[0]?.group
                      return (
                        <Link href={`/dashboard/marks?childId=${child.id}`} key={child.id}>
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer bg-white">
                            <Avatar className="h-10 w-10 ring-2 ring-pink-200">
                              <AvatarImage src={child.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${child.photo}` : ""} />
                              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-rose-500 text-white text-sm font-bold">
                                {child.first_name?.[0]}{child.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">{child.first_name} {child.last_name}</p>
                              <p className="text-xs text-gray-500">
                                {childGroup ? childGroup.name : "Guruhga biriktirilmagan"}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </div>
                        </Link>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* STUDENT OVERVIEW */
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-indigo-700 text-white border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                        <School className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{groupName || "—"}</p>
                        <p className="text-xs text-white/80">Guruh</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Personal Info */}
              <Card className="border-0 shadow-lg bg-white">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-3 rounded-t-xl">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Shaxsiy ma'lumotlar
                  </h2>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Telefon</p>
                        <p className="font-medium text-gray-900 text-sm">{profileData?.phone_number || "Kiritilmagan"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Xona</p>
                        <p className="font-medium text-gray-900 text-sm">{group?.room?.name || "—"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Teachers */}
              {(mainTeacher || supportTeacher) && (
                <Card className="border-0 shadow-lg bg-white">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 rounded-t-xl">
                    <h2 className="font-semibold text-white flex items-center gap-2">
                      <UserCheck className="h-4 w-4" /> Ustozlarim
                    </h2>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {mainTeacher && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                        <Avatar className="h-11 w-11 ring-2 ring-blue-300">
                          <AvatarImage src={mainTeacher.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/teachers/${mainTeacher.photo}` : ""} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
                            {mainTeacher.first_name?.[0]}{mainTeacher.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{mainTeacher.first_name} {mainTeacher.last_name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-[9px]">Asosiy</Badge>
                            {mainTeacher.phone_number && <span>{mainTeacher.phone_number}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                    {supportTeacher && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100">
                        <Avatar className="h-11 w-11 ring-2 ring-emerald-300">
                          <AvatarImage src={supportTeacher.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/teachers/${supportTeacher.photo}` : ""} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-bold">
                            {supportTeacher.first_name?.[0]}{supportTeacher.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{supportTeacher.first_name} {supportTeacher.last_name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px]">Yordamchi</Badge>
                            {supportTeacher.phone_number && <span>{supportTeacher.phone_number}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ==================== SECURITY TAB ==================== */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Photo Upload */}
            <Card className="border-0 shadow-lg bg-white">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 rounded-t-xl">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Profil rasmi
                </h2>
              </div>
              <CardContent className="p-6 text-center space-y-4">
                <Avatar className="h-28 w-28 mx-auto ring-4 ring-purple-100 shadow-lg">
                  <AvatarImage src={photoPreview} alt={fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Rasm tanlash
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                {photoFile && (
                  <Button
                    onClick={uploadPhoto}
                    disabled={savingPhoto}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg"
                  >
                    {savingPhoto ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Saqlash
                  </Button>
                )}
                <p className="text-xs text-gray-400">JPG, PNG, GIF formatlari qo'llab-quvvatlanadi</p>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-0 shadow-lg bg-white">
              <div className="bg-gradient-to-r from-rose-600 to-red-600 px-5 py-3 rounded-t-xl">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Parolni o'zgartirish
                </h2>
              </div>
              <CardContent className="p-6 space-y-5">
                {/* Current Password */}
                {!isParent && (
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-gray-700 font-medium">Joriy parol</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Joriy parolingizni kiriting"
                        className="pr-10 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-gray-700 font-medium">Yangi parol</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yangi parol (kamida 4 belgi)"
                      className="pr-10 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-gray-700 font-medium">Parolni tasdiqlang</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yangi parolni qayta kiriting"
                      className={`pr-10 border-gray-300 ${confirmPassword && newPassword !== confirmPassword ? 'border-red-400 focus:border-red-500' : ''}`}
                    />
                    {confirmPassword && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {newPassword === confirmPassword ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">Parollar mos kelmadi</p>
                  )}
                </div>

                <Button
                  onClick={changePassword}
                  disabled={savingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 4}
                  className="w-full bg-gradient-to-r from-rose-600 to-red-600 text-white border-0 shadow-lg hover:from-rose-700 hover:to-red-700"
                >
                  {savingPassword ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Parolni yangilash
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== ACTIVITIES TAB ==================== */}
        <TabsContent value="activities">
          {isStudent && group ? (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-white">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 rounded-t-xl">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <Award className="h-4 w-4" /> O'quv jarayoni
                  </h2>
                </div>
                <CardContent className="p-6 space-y-4">
                  <Link href="/dashboard/marks">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Baholar va davomat</p>
                          <p className="text-xs text-gray-500">O'zlashtirishni ko'rish</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-amber-400" />
                    </div>
                  </Link>
                  <Link href="/dashboard/lessons">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Darslar</p>
                          <p className="text-xs text-gray-500">O'tilgan va kelgusi darslar</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-blue-400" />
                    </div>
                  </Link>
                  <Link href="/dashboard/payments">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">To'lovlar</p>
                          <p className="text-xs text-gray-500">To'lov tarixi va qarzdorlik</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-emerald-400" />
                    </div>
                  </Link>
                  <Link href="/dashboard/exercises/tasks">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Award className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Topshiriqlar</p>
                          <p className="text-xs text-gray-500">Test va mashqlar</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-purple-400" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : isTeacher ? (
            <Card className="border-0 shadow-lg bg-white">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 rounded-t-xl">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Award className="h-4 w-4" /> Faoliyat
                </h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <Link href="/dashboard/marks">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Guruhlarim</p>
                        <p className="text-xs text-gray-500">{teacherGroups.length} ta guruh, {totalStudents} ta o'quvchi</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-amber-400" />
                  </div>
                </Link>
                <Link href="/dashboard/lessons">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Dars jadvali</p>
                        <p className="text-xs text-gray-500">Darslar va rejalar</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-400" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          ) : isParent ? (
            <Card className="border-0 shadow-lg bg-white">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3 rounded-t-xl">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Award className="h-4 w-4" /> Farzandlar faoliyati
                </h2>
              </div>
              <CardContent className="p-6 space-y-4">
                {children && children.length > 0 ? (
                  children.map((child: any) => (
                    <Link href={`/dashboard/marks?childId=${child.id}`} key={child.id}>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-pink-200">
                            <AvatarImage src={child.photo ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${child.photo}` : ""} />
                            <AvatarFallback className="bg-pink-100 text-pink-700 text-sm">
                              {child.first_name?.[0]}{child.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{child.first_name} {child.last_name}</p>
                            <p className="text-xs text-gray-500">Baholar va davomatni ko'rish</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-pink-400" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">Farzandlar ma'lumoti mavjud emas</p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
