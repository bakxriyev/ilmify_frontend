"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  User,
  Lock,
  Bell,
  Mail,
  Globe,
  Shield,
  Smartphone,
  Trash2,
  Send,
  Loader2,
} from "lucide-react"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [studentData, setStudentData] = useState<any>(null)

  // Form states
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    birth_date: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [notifications, setNotifications] = useState({
    email_marketing: true,
    email_lessons: true,
    push_grades: false,
    push_attendance: true,
  })

  const [supportMessage, setSupportMessage] = useState({
    subject: "",
    message: "",
  })

  const [language, setLanguage] = useState("uz")
  const [timezone, setTimezone] = useState("Asia/Tashkent")

  const [devices, setDevices] = useState<any[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)

  // Fetch student data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      try {
        const data = await api.getStudentById(user.id)
        setStudentData(data)
        setProfileForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          birth_date: data.birth_date || "",
        })
        // Fetch devices (mock for now)
        setDevices([
          { id: 1, name: "iPhone 14 Pro", lastActive: "2 minutes ago", current: true },
          { id: 2, name: "MacBook Pro", lastActive: "yesterday", current: false },
        ])
      } catch (error) {
        console.error("Failed to load profile", error)
        toast.error("Could not load profile data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // API call to update profile
      await api.updateStudent(user?.id, profileForm)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Passwords do not match")
      return
    }
    setSaving(true)
    try {
      await api.changePassword(user?.id, {
        current: passwordForm.current_password,
        new: passwordForm.new_password,
      })
      toast.success("Password changed successfully")
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" })
    } catch (error) {
      toast.error("Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.sendSupportMessage({
        userId: user?.id,
        ...supportMessage,
      })
      toast.success("Message sent to administrators")
      setSupportMessage({ subject: "", message: "" })
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    // Optionally save to backend
  }

  const handleRevokeDevice = async (deviceId: number) => {
    try {
      // API call to revoke session
      setDevices((prev) => prev.filter((d) => d.id !== deviceId))
      toast.success("Device revoked")
    } catch (error) {
      toast.error("Failed to revoke device")
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await api.deleteAccount(user?.id)
        toast.success("Account deleted")
        logout()
      } catch (error) {
        toast.error("Failed to delete account")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    )
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

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile Card (quick view) */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-yellow-400 to-orange-500" />
        <CardContent className="relative -mt-12 flex items-end gap-6 pb-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src={studentData?.photo ? `http://localhost:4000/uploads/students/${studentData.photo}` : "/user.png"} />
            <AvatarFallback className="bg-gray-300 text-2xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="mb-2">
            <h2 className="text-2xl font-bold">{fullName}</h2>
            <p className="text-gray-500">{studentData?.email}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Profile Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Birth date</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profileForm.birth_date}
                  onChange={(e) => setProfileForm({ ...profileForm, birth_date: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Change Password
            </CardTitle>
            <CardDescription>Ensure your account is secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </CardTitle>
            <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_marketing">Marketing emails</Label>
                <p className="text-sm text-gray-500">Receive updates about new features</p>
              </div>
              <Switch
                id="email_marketing"
                checked={notifications.email_marketing}
                onCheckedChange={() => handleNotificationChange("email_marketing")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_lessons">Lesson reminders</Label>
                <p className="text-sm text-gray-500">Get notified before your lessons</p>
              </div>
              <Switch
                id="email_lessons"
                checked={notifications.email_lessons}
                onCheckedChange={() => handleNotificationChange("email_lessons")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_grades">Grade updates</Label>
                <p className="text-sm text-gray-500">Push notifications when new marks are added</p>
              </div>
              <Switch
                id="push_grades"
                checked={notifications.push_grades}
                onCheckedChange={() => handleNotificationChange("push_grades")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push_attendance">Attendance alerts</Label>
                <p className="text-sm text-gray-500">Get notified if you're marked absent</p>
              </div>
              <Switch
                id="push_attendance"
                checked={notifications.push_attendance}
                onCheckedChange={() => handleNotificationChange("push_attendance")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Administrator / Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Contact Administrator
            </CardTitle>
            <CardDescription>Send a message to the school administration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Complaint, Question, Request"
                  value={supportMessage.subject}
                  onChange={(e) => setSupportMessage({ ...supportMessage, subject: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="Write your message here..."
                  value={supportMessage.message}
                  onChange={(e) => setSupportMessage({ ...supportMessage, message: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" /> Language & Region
            </CardTitle>
            <CardDescription>Set your preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Tashkent">Tashkent (UTC+5)</SelectItem>
                  <SelectItem value="Asia/Samarkand">Samarkand (UTC+5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Connected Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" /> Connected Devices
            </CardTitle>
            <CardDescription>Manage active sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 border rounded-2xl">
                <div className="flex items-center gap-4">
                  <Smartphone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-gray-500">Last active: {device.lastActive}</p>
                  </div>
                </div>
                {device.current ? (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Current</span>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleRevokeDevice(device.id)}>
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
                <div>
                  <p className="font-semibold">Delete Account</p>
                  <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}