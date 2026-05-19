"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useAuth } from "@/contexts/AuthContext"
import { api, Payment } from "@/lib/api"
import {
  CreditCard, Wallet, TrendingUp, ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, DollarSign, CalendarDays, School,
  Users, GraduationCap, MapPin, BookOpen
} from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

export default function PaymentsPage() {
  const { user, isStudent, isParent } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const childId = searchParams.get('childId')

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [parentChildren, setParentChildren] = useState<any[]>([])

  const activeUserId = childId || user?.id?.toString()
  const isParentView = isParent && !!childId

  const loadData = useCallback(async () => {
    if (!activeUserId) return
    try {
      setLoading(true)
      if (isParent && !childId) {
        const children = await api.getParentChildren(Number(user!.id))
        setParentChildren(children)
        if (children.length > 0) {
          const firstChild = children[0]
          const [p, info] = await Promise.all([
            api.getStudentPayments(firstChild.id),
            api.getStudentById(firstChild.id),
          ])
          setPayments(p)
          setStudentInfo(info)
        }
      } else {
        const [p, info] = await Promise.all([
          api.getStudentPayments(activeUserId),
          api.getStudentById(activeUserId),
        ])
        setPayments(p)
        setStudentInfo(info)
      }
    } catch (err) {
      console.error("Payments load error:", err)
    } finally {
      setLoading(false)
    }
  }, [activeUserId, isParent, childId, user?.id])

  useEffect(() => { loadData() }, [loadData])

  const yearPayments = payments.filter(p => p.year === selectedYear)

  const getMonthStatus = (month: number) => {
    const monthPay = yearPayments.filter(p => p.month === month)
    const total = monthPay.reduce((s, p) => s + Number(p.amount), 0)
    const paid = monthPay.reduce((s, p) => s + (p.status === 'paid' ? Number(p.amount) : 0), 0)
    const anyPaid = monthPay.some(p => p.status === 'paid')
    const anyPartial = monthPay.some(p => p.status === 'partial')
    const status = anyPaid ? (anyPartial ? 'partial' : monthPay.every(p => p.status === 'paid') ? 'paid' : 'partial') : monthPay.length > 0 ? 'unpaid' : 'no_data'
    return { amount: total, paid, debt: total - paid, status, hasRecord: monthPay.length > 0 }
  }

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount), 0)
  const totalDebt = payments
    .filter(p => p.status !== 'paid')
    .reduce((s, p) => s + Number(p.amount), 0)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentMonthPay = getMonthStatus(currentMonth)

  const gs = studentInfo?.group_students?.[0]
  const group = gs?.group
  const fullName = studentInfo ? `${studentInfo.first_name || ''} ${studentInfo.last_name || ''}`.trim() : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {isParentView && (
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To'lovlar</h1>
          <p className="text-gray-500 text-sm">{fullName || 'Yuklanmoqda...'}</p>
        </div>
      </div>

      {/* Parent child selector */}
      {isParent && parentChildren.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {parentChildren.map((child: any) => (
            <Button
              key={child.id}
              variant={childId === String(child.id) || (!childId && parentChildren[0]?.id === child.id) ? 'default' : 'outline'}
              size="sm"
              className="shrink-0"
              onClick={() => router.push(`/dashboard/payments?childId=${child.id}`)}
            >
              {child.first_name} {child.last_name}
            </Button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={`border-0 shadow-md overflow-hidden ${currentMonthPay.status === 'paid' ? 'bg-gradient-to-br from-green-500 to-emerald-700' : currentMonthPay.status === 'partial' ? 'bg-gradient-to-br from-amber-500 to-orange-700' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}>
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Joriy oy</p>
              <Wallet className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-lg font-bold">{
              currentMonthPay.status === 'paid' ? "To'langan" :
              currentMonthPay.status === 'partial' ? "Qisman" :
              currentMonthPay.status === 'unpaid' ? "To'lanmagan" : "Ma'lumot yo'q"
            }</p>
            {currentMonthPay.amount > 0 && (
              <p className="text-xs text-white/70 mt-1">{currentMonthPay.amount.toLocaleString()} UZS</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-700">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Oylik narx</p>
              <DollarSign className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-lg font-bold">
              {group?.monthly_price ? Number(group.monthly_price).toLocaleString() : "—"}
            </p>
            <p className="text-xs text-white/70 mt-1">so'm / oy</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-700">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Jami to'langan</p>
              <CheckCircle2 className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-lg font-bold">{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-white/70 mt-1">so'm</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-rose-500 to-pink-700">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Qarzdorlik</p>
              <XCircle className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-lg font-bold">{totalDebt.toLocaleString()}</p>
            <p className="text-xs text-white/70 mt-1">so'm</p>
          </CardContent>
        </Card>
      </div>

      {/* Group Info */}
      {group && (
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <School className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{group.name}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  {group.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {group.room.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> {group.level?.name || ''}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month-by-month grid */}
      <Card className="border-0 shadow-md bg-white">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Yillik to'lov taqvimi
            </h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y - 1)} className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-white text-sm font-medium min-w-[60px] text-center">{selectedYear}</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedYear(y => y + 1)} className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {MONTHS.map((name, idx) => {
              const m = idx + 1
              const data = getMonthStatus(m)
              const isCurrent = m === currentMonth && selectedYear === currentYear
              return (
                <div
                  key={m}
                  className={`
                    p-2 rounded-xl text-center border transition-all
                    ${isCurrent ? 'ring-2 ring-blue-400' : ''}
                    ${data.status === 'paid' ? 'bg-green-50 border-green-200' :
                      data.status === 'partial' ? 'bg-amber-50 border-amber-200' :
                      data.status === 'unpaid' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'}
                  `}
                >
                  <p className="text-[10px] font-medium text-gray-500 mb-0.5">{name}</p>
                  {data.status === 'paid' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                  ) : data.status === 'partial' ? (
                    <Clock className="h-4 w-4 text-amber-600 mx-auto" />
                  ) : data.status === 'unpaid' ? (
                    <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                  ) : (
                    <span className="text-[10px] text-gray-400">—</span>
                  )}
                  {data.amount > 0 && (
                    <p className="text-[9px] text-gray-500 mt-0.5">{data.amount.toLocaleString()}</p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> To'langan</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-600" /> Qisman</span>
            <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> To'lanmagan</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 ? (
        <Card className="border-0 shadow-md bg-white">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> To'lov tarixi
            </h2>
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              {payments
                .slice()
                .sort((a, b) => b.year - a.year || b.month - a.month)
                .map((p) => (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                  p.status === 'paid' ? 'border-green-100 bg-green-50/50' :
                  p.status === 'partial' ? 'border-amber-100 bg-amber-50/50' :
                  'border-red-100 bg-red-50/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      p.status === 'paid' ? 'bg-green-200' :
                      p.status === 'partial' ? 'bg-amber-200' : 'bg-red-200'
                    }`}>
                      {p.status === 'paid' ? (
                        <CheckCircle2 className={`h-5 w-5 ${p.status === 'paid' ? 'text-green-700' : ''}`} />
                      ) : p.status === 'partial' ? (
                        <Clock className="h-5 w-5 text-amber-700" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{MONTHS[p.month - 1]} {p.year}</p>
                      <p className="text-xs text-gray-500">{p.amount.toLocaleString()} UZS</p>
                    </div>
                  </div>
                  <Badge className={`border-0 ${
                    p.status === 'paid' ? 'bg-green-100 text-green-700' :
                    p.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {p.status === 'paid' ? "To'langan" : p.status === 'partial' ? 'Qisman' : "To'lanmagan"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-10 text-center">
            <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">To'lov ma'lumotlari mavjud emas</p>
            <p className="text-sm text-gray-400 mt-1">Hali hech qanday to'lov qayd etilmagan</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
