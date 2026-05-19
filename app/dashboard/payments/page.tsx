"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useAuth } from "@/contexts/AuthContext"
import { api, Payment } from "@/lib/api"
import {
  CreditCard, Wallet, ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, DollarSign, CalendarDays, School,
  GraduationCap, MapPin, AlertTriangle,
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

  const gs = studentInfo?.group_students?.[0]
  const group = gs?.group
  const monthlyPrice = Number(group?.monthly_price) || 0
  const fullName = studentInfo ? `${studentInfo.first_name || ''} ${studentInfo.last_name || ''}`.trim() : ''

  // Determine membership months from joined_date to left_date/now
  const joinedDate = gs?.joined_date ? new Date(gs.joined_date) : null
  const leftDate = gs?.left_date ? new Date(gs.left_date) : null
  const firstActiveMonth = joinedDate && selectedYear >= joinedDate.getFullYear()
    ? (selectedYear === joinedDate.getFullYear() ? joinedDate.getMonth() + 1 : 1)
    : 1
  const lastActiveMonth = leftDate && selectedYear >= leftDate.getFullYear()
    ? (selectedYear === leftDate.getFullYear() ? leftDate.getMonth() +  1 : 12)
    : (selectedYear > new Date().getFullYear() ? 0 : selectedYear === new Date().getFullYear() ? new Date().getMonth() + 1 : 12)

  const yearPayments = payments.filter(p => p.year === selectedYear)

  // Calculate per-month status
  const getMonthStatus = (month: number) => {
    const isBeforeMembership = joinedDate && (
      selectedYear < joinedDate.getFullYear() ||
      (selectedYear === joinedDate.getFullYear() && month < joinedDate.getMonth() + 1)
    )
    const isAfterMembership = leftDate && (
      selectedYear > leftDate.getFullYear() ||
      (selectedYear === leftDate.getFullYear() && month > leftDate.getMonth() + 1)
    )
    const isFutureMonth = selectedYear > new Date().getFullYear() ||
      (selectedYear === new Date().getFullYear() && month > new Date().getMonth() + 1)

    // Don't show status for months before membership or future months
    if (isBeforeMembership || isAfterMembership || isFutureMonth) {
      return { amountExpected: 0, amountPaid: 0, debt: 0, status: 'no_data', hasRecord: false }
    }

    const monthPay = yearPayments.filter(p => p.month === month)
    const hasPaid = monthPay.some(p => p.status === 'paid')
    const hasUnpaid = monthPay.some(p => p.status === 'unpaid')
    const hasPartial = monthPay.some(p => p.status === 'partial')

    const amountPaid = monthPay
      .filter(p => p.status === 'paid' || p.status === 'partial')
      .reduce((s, p) => s + Number(p.amount), 0)
    const amountExpected = hasUnpaid || monthPay.length === 0
      ? monthlyPrice
      : Math.max(monthlyPrice, amountPaid)

    let status: string
    if (monthPay.length === 0) {
      status = monthlyPrice > 0 ? 'unpaid' : 'no_data'
    } else if (hasPaid && !hasUnpaid && !hasPartial) {
      status = 'paid'
    } else if (hasPaid && (hasPartial || hasUnpaid)) {
      status = 'partial'
    } else if (hasPartial && !hasUnpaid) {
      status = 'partial'
    } else {
      status = 'unpaid'
    }

    const debt = status === 'paid' ? 0 : amountExpected - amountPaid

    return { amountExpected, amountPaid, debt, status, hasRecord: monthPay.length > 0 }
  }

  // Total stats across all payments (only within membership period)
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount), 0)

  const totalDebt = (() => {
    let debt = 0
    for (let m = firstActiveMonth; m <= lastActiveMonth; m++) {
      const data = getMonthStatus(m)
      debt += data.debt
    }
    return debt
  })()

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentMonthData = getMonthStatus(currentMonth)

  const formatSum = (n: number) => Math.floor(n).toLocaleString()

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className={`border-0 shadow-md overflow-hidden ${
          currentMonthData.status === 'paid' ? 'bg-gradient-to-br from-green-500 to-emerald-700' :
          currentMonthData.status === 'partial' ? 'bg-gradient-to-br from-amber-500 to-orange-700' :
          'bg-gradient-to-br from-red-500 to-rose-700'
        }`}>
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">
                Joriy oy ({MONTHS[currentMonth - 1]})
              </p>
              <Wallet className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-lg font-bold">
              {currentMonthData.status === 'paid' ? "To'langan" :
               currentMonthData.status === 'partial' ? "Qisman to'langan" :
               currentMonthData.status === 'unpaid' ? "To'lanmagan" : "Ma'lumot yo'q"}
            </p>
            {currentMonthData.status === 'unpaid' && currentMonthData.debt > 0 && (
              <p className="text-xs text-white/80 mt-1">
                <AlertTriangle className="h-3 w-3 inline mr-0.5" />
                Qarzdorlik: {formatSum(currentMonthData.debt)} so'm
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-700">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Oylik to'lov</p>
              <DollarSign className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-lg font-bold">
              {monthlyPrice > 0 ? formatSum(monthlyPrice) : "—"}
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
            <p className="text-lg font-bold">{formatSum(totalPaid)}</p>
            <p className="text-xs text-white/70 mt-1">so'm</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-rose-500 to-pink-700">
          <CardContent className="p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Jami qarzdorlik</p>
              <XCircle className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-lg font-bold">{formatSum(totalDebt)}</p>
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
                  {monthlyPrice > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {formatSum(monthlyPrice)} so'm/oy
                    </span>
                  )}
                  {group.room && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {group.room.name}
                    </span>
                  )}
                  {group.level?.name && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" /> {group.level.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month-by-month payment grid */}
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

              const isBeforeMembership = joinedDate && (
                selectedYear < joinedDate.getFullYear() ||
                (selectedYear === joinedDate.getFullYear() && m < joinedDate.getMonth() + 1)
              )
              const isFutureMonth = selectedYear > new Date().getFullYear() ||
                (selectedYear === new Date().getFullYear() && m > new Date().getMonth() + 1)
              const isAfterLeft = leftDate && (
                selectedYear > leftDate.getFullYear() ||
                (selectedYear === leftDate.getFullYear() && m > leftDate.getMonth() + 1)
              )

              // Months before joining → gray dash
              if (isBeforeMembership) {
                return (
                  <div key={m} className="p-3 rounded-xl text-center border border-dashed border-gray-200 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-300 mb-1">{name}</p>
                    <span className="text-[18px] text-gray-200">—</span>
                    <p className="text-[9px] text-gray-200 mt-1">Guruhga qo'shilmagan</p>
                  </div>
                )
              }

              // Future months → calendar icon
              if (isFutureMonth || isAfterLeft) {
                return (
                  <div key={m} className="p-3 rounded-xl text-center border border-dashed border-gray-200 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-400 mb-1">{name}</p>
                    <CalendarDays className="h-5 w-5 text-gray-300 mx-auto" />
                    <p className="text-[9px] text-gray-300 mt-1">Kutilmoqda</p>
                  </div>
                )
              }

              let bgColor: string, borderColor: string, icon: React.ReactNode, label: string
              if (data.status === 'paid') {
                bgColor = 'bg-green-50'
                borderColor = 'border-green-300'
                icon = <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                label = "To'langan"
              } else if (data.status === 'partial') {
                bgColor = 'bg-amber-50'
                borderColor = 'border-amber-300'
                icon = <Clock className="h-5 w-5 text-amber-600 mx-auto" />
                label = 'Qisman'
              } else if (data.status === 'unpaid') {
                bgColor = 'bg-red-50'
                borderColor = 'border-red-300'
                icon = <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                label = "To'lanmagan"
              } else {
                bgColor = 'bg-gray-50'
                borderColor = 'border-gray-200'
                icon = <span className="text-[10px] text-gray-400 font-mono">—</span>
                label = ''
              }

              return (
                <div
                  key={m}
                  className={`p-3 rounded-xl text-center border transition-all ${bgColor} ${borderColor} ${isCurrent ? 'ring-2 ring-blue-400 shadow-md' : 'shadow-sm'}`}
                  title={`${name} ${selectedYear}: ${label}`}
                >
                  <p className="text-[10px] font-semibold text-gray-500 mb-1">{name}</p>
                  {icon}
                  {data.status !== 'no_data' && (
                    <p className={`text-[10px] font-medium mt-1 ${
                      data.status === 'paid' ? 'text-green-700' :
                      data.status === 'partial' ? 'text-amber-700' :
                      data.status === 'unpaid' ? 'text-red-700' : 'text-gray-400'
                    }`}>
                      {label}
                    </p>
                  )}
                  {data.debt > 0 && (
                    <p className="text-[9px] text-red-500 font-medium mt-0.5">
                      {formatSum(data.debt)} so'm qarz
                    </p>
                  )}
                  {data.amountPaid > 0 && data.status === 'paid' && (
                    <p className="text-[9px] text-green-600 mt-0.5">
                      {formatSum(data.amountPaid)} so'm
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> To'langan</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-600" /> Qisman</span>
            <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-500" /> To'lanmagan</span>
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
                .map((p) => {
                  const pAmount = Number(p.amount)
                  const pDebt = Math.max(0, monthlyPrice - pAmount)
                  return (
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
                            <CheckCircle2 className="h-5 w-5 text-green-700" />
                          ) : p.status === 'partial' ? (
                            <Clock className="h-5 w-5 text-amber-700" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{MONTHS[p.month - 1]} {p.year}</p>
                          <p className="text-xs text-gray-500">{formatSum(pAmount)} UZS</p>
                          {pDebt > 0 && (
                            <p className="text-xs text-red-500 font-medium">Qarz: {formatSum(pDebt)} UZS</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`border-0 ${
                          p.status === 'paid' ? 'bg-green-100 text-green-700' :
                          p.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.status === 'paid' ? "To'langan" : p.status === 'partial' ? 'Qisman' : "To'lanmagan"}
                        </Badge>
                        {p.status !== 'paid' && (
                          <p className="text-[10px] text-red-500 mt-1 font-medium">
                            To'lov qiling!
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md bg-white">
          <CardContent className="p-10 text-center">
            <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">To'lov ma'lumotlari mavjud emas</p>
            <p className="text-sm text-gray-400 mt-1">Hali hech qanday to'lov qayd etilmagan</p>
            {monthlyPrice > 0 && (
              <p className="text-xs text-red-400 mt-3">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Oylik to'lov {formatSum(monthlyPrice)} so'm. Iltimos, to'lovni amalga oshiring!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
