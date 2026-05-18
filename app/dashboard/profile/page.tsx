"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Smartphone, Mail, Calendar, MapPin, BookOpen, Phone } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth()
  const [studentData, setStudentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      try {
        const data = await api.getStudentById(user.id)
        setStudentData(data)
      } catch (error) {
        console.error("Failed to load profile", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  if (loading) {
    return <div className="p-8 text-center">Loading profile...</div>
  }

  const fullName = studentData
    ? `${studentData.first_name ?? ""} ${studentData.last_name ?? ""}`.trim()
    : "Student"
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const avatarSrc =
    !studentData?.photo || imageError
      ? "/user.png"
      : `${process.env.NEXT_PUBLIC_API_URL}/uploads/students/${studentData.photo}`

  const group = studentData?.group_students?.[0]?.group
  const level = group?.level?.name ?? "No level"
  const groupName = group?.name ?? "No group"

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8">
      {/* Header with cover */}
      <div className="relative mb-8">
       <div className='h-48 md:h-64 rounded-3xl bg-[url("/logo.png")] bg-cover bg-center' />
        <div className="absolute -bottom-12 left-8 flex items-end gap-6">
          <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-xl">
            <AvatarImage src={avatarSrc} alt={fullName} onError={() => setImageError(true)} />
            <AvatarFallback className="bg-gray-300 text-4xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="mb-4 hidden md:block">
            <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <Badge variant="outline" className="rounded-full">{level}</Badge>
              <span>•</span>
              <span>{groupName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile name (visible only on small screens) */}
      <div className="md:hidden mt-16 mb-6 px-4">
        <h1 className="text-2xl font-bold">{fullName}</h1>
        <p className="text-gray-600 flex items-center gap-2 mt-1">
          <Badge variant="outline" className="rounded-full">{level}</Badge>
          <span>•</span>
          <span>{groupName}</span>
        </p>
      </div>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 p-1 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="devices" className="rounded-xl data-[state=active]:bg-white">Devices</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-white">Settings</TabsTrigger>
        </TabsList>

        {/* ========== OVERVIEW TAB ========== */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span>{studentData?.email || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span>Age: {studentData?.age || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span>{studentData?.phone_number || "No address"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                  <span>Group: {groupName} ({level})</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Academic Progress</CardTitle>
                <CardDescription>Your marks and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Marks will appear here.</p>
                {/* You can later map over studentData.marks */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== DEVICES TAB ========== */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>Manage devices where you're logged in</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-2xl">
                  <div className="flex items-center gap-4">
                    <Smartphone className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="font-medium">iPhone 14 Pro</p>
                      <p className="text-sm text-gray-500">Last active: 2 minutes ago</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Current</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-2xl">
                  <div className="flex items-center gap-4">
                    <Smartphone className="h-6 w-6 text-gray-500" />
                    <div>
                      <p className="font-medium">MacBook Pro</p>
                      <p className="text-sm text-gray-500">Last active: yesterday</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500">Revoke</Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <Input id="first_name" defaultValue={studentData?.first_name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" defaultValue={studentData?.last_name || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={studentData?.email || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue={studentData?.address || ""} />
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