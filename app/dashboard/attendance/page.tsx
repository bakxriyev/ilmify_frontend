"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import {
  MapPin, Camera, CheckCircle2, XCircle, RefreshCw, Send,
  Clock, ArrowLeft, Loader2, AlertTriangle, Navigation,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"

interface CenterLocation {
  id: number
  name: string
  latitude: number
  longitude: number
  radius: number
  address?: string
}

interface Position {
  lat: number
  lng: number
}

export default function TeacherAttendancePage() {
  const { user, isTeacher } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<"location" | "camera" | "preview" | "done">("location")
  const [loading, setLoading] = useState(false)
  const [centerLocation, setCenterLocation] = useState<CenterLocation | null>(null)
  const [userPosition, setUserPosition] = useState<Position | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [withinRadius, setWithinRadius] = useState<boolean | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (!isTeacher || !user?.id) {
      router.push("/dashboard")
      return
    }
    checkTodayStatus()
  }, [isTeacher, user])

  const checkTodayStatus = async () => {
    setCheckingStatus(true)
    try {
      const today = format(new Date(), "yyyy-MM-dd")
      const result = await api.getTeacherMyAttendanceRecords({
        start_date: today,
        end_date: today,
        limit: 5,
      })
      const records = result.data || []
      const checkedIn = records.find(
        (r: any) => r.status === "checked_in" || r.status === "CHECKED_IN",
      )
      const checkedOut = records.find(
        (r: any) => r.status === "checked_out" || r.status === "CHECKED_OUT",
      )
      if (checkedOut) {
        setTodayRecord(checkedOut)
        setStep("done")
      } else if (checkedIn) {
        setTodayRecord(checkedIn)
        setStep("done")
      }
    } catch (err) {
      console.error("Failed to check today status:", err)
    } finally {
      setCheckingStatus(false)
    }
  }

  const fetchCenterLocation = useCallback(async () => {
    try {
      const loc = await api.getTeacherCenterLocation()
      setCenterLocation(loc)
      return loc
    } catch (err: any) {
      setLocationError(err.message || "Markaz lokatsiyasini olishda xatolik")
      return null
    }
  }, [])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getLocation = async () => {
    setLocationError(null)
    setLoading(true)

    if (!navigator.geolocation) {
      setLocationError("Bu brauzer lokatsiyani qo'llab-quvvatlamaydi")
      setLoading(false)
      return
    }

    try {
      const loc = await fetchCenterLocation()
      if (!loc) {
        setLoading(false)
        return
      }

      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const userPos: Position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }
      setUserPosition(userPos)

      const dist = calculateDistance(
        userPos.lat, userPos.lng,
        Number(loc.latitude), Number(loc.longitude),
      )
      setDistance(Math.round(dist))

      if (dist <= Number(loc.radius)) {
        setWithinRadius(true)
        startCamera()
      } else {
        setWithinRadius(false)
      }
    } catch (err: any) {
      if (err.code === 1) {
        setLocationError("Lokatsiyaga ruxsat berilmagan. Iltimos, brauzer sozlamalarida ruxsat bering.")
      } else if (err.code === 2) {
        setLocationError("Lokatsiyani aniqlab bo'lmadi. Internet aloqasini tekshiring.")
      } else if (err.code === 3) {
        setLocationError("Lokatsiyani aniqlash vaqti tugadi. Qayta urinib ko'ring.")
      } else {
        setLocationError(err.message || "Lokatsiyani aniqlashda xatolik")
      }
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    setCameraError(null)
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.playsInline = true
        videoRef.current.setAttribute("playsinline", "true")
        videoRef.current.setAttribute("autoplay", "true")
        videoRef.current.muted = true
        await videoRef.current.play()
      }

      setStep("camera")
    } catch (err: any) {
      console.error("Camera error:", err)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Kameraga ruxsat berilmagan. Brauzer sozlamalarida ruxsat bering.")
      } else if (err.name === "NotFoundError") {
        setCameraError("Kamera topilmadi. Qurilmangizda kamera mavjudligini tekshiring.")
      } else if (err.name === "NotReadableError") {
        setCameraError("Kameradan foydalanib bo'lmaydi. Boshqa dastur kameradan foydalanayotgan bo'lishi mumkin.")
      } else {
        setCameraError(`Kamerani ochishda xatolik: ${err.message}`)
      }
      setStep("location")
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
    } else {
      canvas.width = 640
      canvas.height = 480
      ctx.drawImage(video, 0, 0, 640, 480)
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    setCapturedImage(dataUrl)
    setStep("preview")

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setCameraError(null)
    startCamera()
  }

  const submitCheckIn = async () => {
    if (!capturedImage || !userPosition) return

    setSubmitting(true)
    try {
      const blob = await (await fetch(capturedImage)).blob()
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" })

      const formData = new FormData()
      formData.append("selfie", file)
      formData.append("latitude", String(userPosition.lat))
      formData.append("longitude", String(userPosition.lng))

      const result = await api.teacherCheckIn(formData)
      setTodayRecord(result)
      setStep("done")
      toast.success("Ishga kelishingiz qayd etildi!")
    } catch (err: any) {
      toast.error(err.message || "Check-in amalga oshmadi")
    } finally {
      setSubmitting(false)
    }
  }

  const submitCheckOut = async () => {
    if (!userPosition) {
      toast.error("Lokatsiyani aniqlab bo'lmadi")
      return
    }

    setSubmitting(true)
    try {
      const result = await api.teacherCheckOut({
        latitude: userPosition.lat,
        longitude: userPosition.lng,
      })
      setTodayRecord(result)
      toast.success("Ishdan chiqishingiz qayd etildi!")
    } catch (err: any) {
      toast.error(err.message || "Check-out amalga oshmadi")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckOutWithLocation = async () => {
    setLoading(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })
      setUserPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      })
      await submitCheckOut()
    } catch (err: any) {
      if (err.code === 1) {
        toast.error("Lokatsiyaga ruxsat berilmagan")
      } else {
        toast.error("Lokatsiyani aniqlab bo'lmadi")
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (d: string | null) => {
    if (!d) return "—"
    try {
      return format(new Date(d), "HH:mm")
    } catch {
      return "—"
    }
  }

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (step === "done" && todayRecord) {
    const isCheckedOut =
      todayRecord.status === "checked_out" || todayRecord.status === "CHECKED_OUT"

    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Ortga</span>
        </button>

        <Card className="border-0 shadow-xl overflow-hidden">
          <div className={`p-6 text-center ${isCheckedOut ? "bg-gradient-to-r from-gray-600 to-gray-800" : "bg-gradient-to-r from-green-600 to-emerald-600"}`}>
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
              {isCheckedOut ? (
                <XCircle className="h-10 w-10 text-white" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isCheckedOut ? "Ish tugagan" : "Ishda"}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {format(new Date(), "dd.MM.yyyy")}
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Kirish</p>
                <p className="text-xl font-bold text-green-700">
                  {formatTime(todayRecord.check_in)}
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Chiqish</p>
                <p className="text-xl font-bold text-red-700">
                  {formatTime(todayRecord.check_out)}
                </p>
              </div>
            </div>

            {todayRecord.distance && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{Math.round(todayRecord.distance)} m masofa</span>
              </div>
            )}

            {todayRecord.selfie && (
              <div className="flex justify-center">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/teacher-attendance/${todayRecord.selfie}`}
                  alt="Selfie"
                  className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>
            )}

            {!isCheckedOut && (
              <Button
                onClick={handleCheckOutWithLocation}
                disabled={submitting || loading}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white border-0 shadow-lg h-12 text-base"
              >
                {submitting || loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                Ishni yakunlash (Check-out)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "location") {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Ortga</span>
        </button>

        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-center">
            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Navigation className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Ishga kirish</h2>
            <p className="text-white/80 text-sm mt-1">
              Lokatsiyangizni tekshirish uchun pastdagi tugmani bosing
            </p>
          </div>

          <CardContent className="p-6 space-y-4">
            {locationError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Xatolik</p>
                  <p className="text-xs text-red-600 mt-1">{locationError}</p>
                </div>
              </div>
            )}

            {withinRadius === false && distance !== null && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Masofa juda katta</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Siz o'quv markazidan {distance} m uzoqlikdasiz. Iltimos, markazga yaqinroq keling.
                  </p>
                </div>
              </div>
            )}

            {distance !== null && withinRadius && centerLocation && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Lokatsiya tasdiqlandi</p>
                  <p className="text-xs text-green-600 mt-1">
                    Siz markazdan {distance} m masofadasiz. Kamera ochilmoqda...
                  </p>
                </div>
              </div>
            )}

            {centerLocation && (
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{centerLocation.name}</p>
                  <p className="text-xs text-gray-500">
                    Radius: {centerLocation.radius} m
                    {distance !== null && ` | Siz: ${distance} m`}
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={getLocation}
              disabled={loading || withinRadius === true}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg h-12 text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <MapPin className="h-5 w-5 mr-2" />
              )}
              {loading ? "Tekshirilmoqda..." : "Lokatsiyani tekshirish"}
            </Button>

            {locationError && (
              <Button
                onClick={getLocation}
                variant="outline"
                className="w-full h-10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Qayta urinish
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "camera") {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Camera className="h-5 w-5 text-white" />
              <h2 className="text-lg font-bold text-white">Selfie oling</h2>
            </div>
            <p className="text-white/70 text-xs mt-1">Ishga kelganingizni tasdiqlash uchun rasmingizni oling</p>
          </div>

          <CardContent className="p-4">
            {cameraError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Kamera xatoligi</p>
                  <p className="text-xs text-red-600 mt-1">{cameraError}</p>
                </div>
              </div>
            )}

            <div className="relative bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute inset-0 border-4 border-white/30 rounded-xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-xs text-center">Yuzingizni kadrga to'g'ri joylashtiring</p>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-purple-500 shadow-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>
            </div>

            <Button
              onClick={retakePhoto}
              variant="ghost"
              className="w-full mt-3 text-gray-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Kamerani qayta boshlash
            </Button>
          </CardContent>
        </Card>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  if (step === "preview") {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-white" />
              <h2 className="text-lg font-bold text-white">Rasm tayyor</h2>
            </div>
            <p className="text-white/70 text-xs mt-1">Iltimos, rasmni tekshiring va jo'natishni tasdiqlang</p>
          </div>

          <CardContent className="p-4 space-y-4">
            <div className="relative bg-black rounded-xl overflow-hidden">
              <img
                src={capturedImage || ""}
                alt="Captured selfie"
                className="w-full aspect-[3/4] object-cover"
              />
            </div>

            {distance !== null && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>Markazdan {distance} m masofa</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1 h-12 border-gray-300"
                disabled={submitting}
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Qayta olish
              </Button>
              <Button
                onClick={submitCheckIn}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-lg h-12 text-base"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Send className="h-5 w-5 mr-2" />
                )}
                {submitting ? "Jo'natilmoqda..." : "Jo'natish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
