"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { api, TeacherGroup } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Smartphone, Mail, Calendar, MapPin, BookOpen, Phone, School, Users, Wallet, TrendingUp, GraduationCap } from 'lucide-react';
import Link from "next/link"

export default function ProfilePage() {
  const { user, isTeacher, isStudent, isParent } = useAuth()
  const [profileData, setProfileData] = useState<any>(null)
  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

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
          const allGroups = [...(groupsData.main_groups || []), ...(groupsData.support_groups || [])]
          setTeacherGroups(allGroups)
        } else {
          const data = await api.getStudentById(user.id)
          setProfileData(data)
        }
      } catch (error) {
        console.error("Failed to load profile", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id, isTeacher])

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 md:p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-48 md:h-64 bg-gray-200 rounded-3xl" />
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    )
  }

  const fullName = profileData
    ? `${profileData.first_name ?? ""} ${profileData.last_name ?? ""}`.trim()
    : isTeacher ? "O'qituvchi" : isParent ? "Ota-ona" : "Student"
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const photoFolder = isTeacher ? 'teachers' : isParent ? 'parents' : 'students'
  const avatarSrc =
    !profileData?.photo || imageError
      ? "/user.png"
      : `${process.env.NEXT_PUBLIC_API_URL}/uploads/${photoFolder}/${profileData.photo}`

  // Student specific
  const group = profileData?.group_students?.[0]?.group
  const level = group?.level?.name ?? ""
  const groupName = group?.name ?? ""

  // Teacher specific
  const totalStudents = teacherGroups.reduce((s, g) => s + (g.student_count || 0), 0)
  const totalMonthlyIncome = teacherGroups.reduce((s, g) => s + ((g.kp || 0) * (g.student_count || 0)), 0)

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8">
      {/* Header with cover */}
      <div className="relative mb-8">
        <div className="h-48 md:h-56 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-800 to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_50%)]" />
        </div>
        <div className="absolute -bottom-12 left-4 md:left-8 flex items-end gap-4 md:gap-6">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white shadow-xl">
            <AvatarImage src={avatarSrc} alt={fullName} onError={() => setImageError(true)} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="mb-2 hidden md:block">
            <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <Badge variant="outline" className="rounded-full">
                {isTeacher ? "O'qituvchi" : isParent ? "Ota-ona" : level || "O'quvchi"}
              </Badge>
              {groupName && (
                <>
                  <span>•</span>
                  <span>{groupName}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile name */}
      <div className="md:hidden mt-16 mb-4 px-2">
        <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
        <p className="text-gray-600 flex items-center gap-2 mt-1 text-sm">
          <Badge variant="outline" className="rounded-full text-xs">
            {isTeacher ? "O'qituvchi" : isParent ? "Ota-ona" : level || "O'quvchi"}
          </Badge>
          {groupName && (
            <>
              <span>•</span>
              <span>{groupName}</span>
            </>
          )}
        </p>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GraduationCap className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Smartphone className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview">
          {isTeacher ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 shadow-lg">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <School className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{teacherGroups.length}</p>
                      <p className="text-xs text-white/80">Guruhlar</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white border-0 shadow-lg">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{totalStudents}</p>
                      <p className="text-xs text-white/80">O'quvchilar</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white border-0 shadow-lg">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{totalMonthlyIncome.toLocaleString()}</p>
                      <p className="text-xs text-white/80">Oylik daromad</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500 to-orange-700 text-white border-0 shadow-lg">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{teacherGroups.filter(g => String(g.teacher_id) === String(user?.id)).length}</p>
                      <p className="text-xs text-white/80">Asosiy guruh</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Shaxsiy malumotlar</CardTitle>
                  <CardDescription>Sizning asosiy malumotlaringiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>{profileData?.gmail || profileData?.email || "Kiritilmagan"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span>{profileData?.phone_number || "Kiritilmagan"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      {profileData?.teacher_type === 'MAIN_TEACHER' ? "Asosiy o'qituvchi" : "Yordamchi o'qituvchi"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Groups with KP */}
              <Card>
                <CardHeader>
                  <CardTitle>Mening guruhlarim</CardTitle>
                  <CardDescription>{teacherGroups.length} ta guruh, {totalStudents} ta o'quvchi</CardDescription>
                </CardHeader>
                <CardContent>
                  {teacherGroups.length > 0 ? (
                    <div className="space-y-3">
                      {teacherGroups.map((g) => {
                        const income = (g.kp || 0) * (g.student_count || 0)
                        const isMain = String(g.teacher_id) === String(user?.id)
                        return (
                          <Link href={`/dashboard/marks?groupId=${g.id}`} key={g.id}>
                            <div className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${isMain ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMain ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                  <School className={`h-5 w-5 ${isMain ? 'text-blue-600' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{g.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {g.student_count || 0} o'quvchi
                                    {g.room ? ` • ${g.room.name}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {g.kp ? (
                                  <p className="text-sm font-semibold text-emerald-600">
                                    <Wallet className="h-3.5 w-3.5 inline mr-1" />
                                    {Number(g.kp).toLocaleString()} so'm
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400">KP: -</p>
                                )}
                                <p className="text-xs text-gray-400">
                                  {income.toLocaleString()} so'm/oy
                                </p>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Guruhlar mavjud emas</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Student Overview */
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shaxsiy malumotlar</CardTitle>
                  <CardDescription>Sizning asosiy malumotlaringiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span>{profileData?.email || "Kiritilmagan"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span>Yosh: {profileData?.age || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span>{profileData?.phone_number || "Kiritilmagan"}</span>
                  </div>
                  {groupName && (
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-gray-400" />
                      <span>Guruh: {groupName} {level ? `(${level})` : ''}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>O'quv jarayoni</CardTitle>
                  <CardDescription>Baholar va yutuqlar</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Ma'lumotlar keyinroq qo'shiladi.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ========== SETTINGS TAB ========== */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" defaultValue={profileData?.first_name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" defaultValue={profileData?.last_name || ""} />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="current_password">Current password</Label>
                <Input id="current_password" type="password" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New password</Label>
                  <Input id="new_password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm password</Label>
                  <Input id="confirm_password" type="password" />
                </div>
              </div>
              <Button className="w-full md:w-auto">Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}