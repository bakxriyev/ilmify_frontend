"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { api, type GroupStudentRelation, type Student } from "@/lib/api"
import { Users, Plus, X, Search, Phone, Clock, Check, Loader2, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ilmify-edu.uz'
const DEFAULT_AVATAR = "/user.png"
const monthNames = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

function getPhotoUrl(photo: string | null | undefined): string {
  if (!photo) return DEFAULT_AVATAR
  if (photo.startsWith('http')) return photo
  if (photo.startsWith('/uploads')) return `${API_URL}${photo}`
  return `${API_URL}/uploads/students/${photo}`
}

function formatDate(d: string) {
  if (!d) return '-'
  const date = new Date(d)
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

interface TeacherGroup {
  id: string; name: string; teacher_id: string; support_teacher_id: string; level_id: string
  level?: { id: string; name: string; title: string }
}

export default function StudentsPage() {
  const { user, isTeacher } = useAuth()

  const [teacherGroups, setTeacherGroups] = useState<TeacherGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [relations, setRelations] = useState<GroupStudentRelation[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [search, setSearch] = useState("")

  // Add modal
  const [showAdd, setShowAdd] = useState(false)
  const [addSearch, setAddSearch] = useState("")
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [loadingAll, setLoadingAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0])
  const [submittingAdd, setSubmittingAdd] = useState(false)
  const [addConfirm, setAddConfirm] = useState(false)

  // Remove confirmation
  const [removeTarget, setRemoveTarget] = useState<{ studentId: number; name: string } | null>(null)

  // Edit modal
  const [editStudent, setEditStudent] = useState<{ studentId: number; first_name: string; last_name: string; phone_number: string; password: string } | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    if (!user?.id || !isTeacher) return
    loadGroups()
  }, [user?.id, isTeacher])

  const loadGroups = async () => {
    setLoadingGroups(true)
    try {
      const data = await api.getTeacherGroups(Number(user!.id))
      const all = [...(data.main_groups || []), ...(data.support_groups || [])]
      setTeacherGroups(all)
      if (all.length > 0 && !selectedGroupId) setSelectedGroupId(all[0].id)
    } catch (err) { console.error(err) }
    finally { setLoadingGroups(false) }
  }

  useEffect(() => {
    if (!selectedGroupId) return
    loadStudents()
  }, [selectedGroupId])

  const loadStudents = async () => {
    setLoadingStudents(true)
    try {
      const data = await api.getGroupStudentsByGroup(Number(selectedGroupId))
      setRelations(data)
    } catch { setRelations([]) }
    finally { setLoadingStudents(false) }
  }

  const handleRemove = async () => {
    if (!removeTarget || !selectedGroupId) return
    try {
      await api.removeStudentFromGroup(Number(selectedGroupId), removeTarget.studentId)
      setRemoveTarget(null)
      await loadStudents()
    } catch (err) { console.error(err) }
  }

  const openAddModal = async () => {
    setShowAdd(true)
    setAddSearch("")
    setSelectedIds(new Set())
    setAddConfirm(false)
    setJoinDate(new Date().toISOString().split('T')[0])
    setLoadingAll(true)
    try {
      const res = await api.getAllStudents({ limit: 10000 })
      setAllStudents(res.data || [])
    } catch { setAllStudents([]) }
    finally { setLoadingAll(false) }
  }

  const handleAdd = async () => {
    if (!selectedGroupId || selectedIds.size === 0) return
    setSubmittingAdd(true)
    try {
      await api.bulkAddStudents(Number(selectedGroupId), Array.from(selectedIds), joinDate)
      setShowAdd(false)
      await loadStudents()
    } catch (err) { console.error(err) }
    finally { setSubmittingAdd(false) }
  }

  const filteredAll = allStudents.filter(s => {
    if (!addSearch) return true
    const q = addSearch.toLowerCase()
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || (s.phone_number || '').includes(q)
  })

  const activeRelations = relations.filter(r => !r.left_date)
  const leftRelations = relations.filter(r => r.left_date)
  const selectedGroup = teacherGroups.find(g => g.id === selectedGroupId)

  const searchedActive = activeRelations.filter(rel => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${rel.student?.first_name} ${rel.student?.last_name}`.toLowerCase().includes(q) || (rel.student?.phone_number || '').includes(q)
  })

  if (loadingGroups) {
    return (
      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-32 shrink-0 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" /> O'quvchilarim
        </h1>
      </div>

      {teacherGroups.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60">
          <CardContent className="p-10 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Sizda guruhlar mavjud emas</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Group tabs */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-thin">
            {teacherGroups.map(g => (
              <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
                className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  selectedGroupId === g.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}>
                {g.name}
              </button>
            ))}
          </div>

          {selectedGroup && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-800">{selectedGroup.name}</h2>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    {activeRelations.length} ta faol
                  </Badge>
                  {leftRelations.length > 0 && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                      {leftRelations.length} ta ketgan
                    </Badge>
                  )}
                </div>
                <Button onClick={openAddModal}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md h-9 text-sm rounded-xl">
                  <Plus className="h-4 w-4 mr-1" /> Student qo'shish
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-4 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Qidirish..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>

              {/* Students table */}
              <Card className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden mb-6">
                {loadingStudents ? (
                  <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" /></div>
                ) : searchedActive.length === 0 ? (
                  <CardContent className="p-8 text-center">
                    <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">{search ? "Hech narsa topilmadi" : "Bu guruhda o'quvchilar yo'q"}</p>
                  </CardContent>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">F.I.O</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Telefon</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Qo'shilgan</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {searchedActive.map((rel, idx) => (
                          <tr key={rel.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-400 font-semibold">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => setEditStudent({
                                studentId: rel.student_id,
                                first_name: rel.student?.first_name || '',
                                last_name: rel.student?.last_name || '',
                                phone_number: rel.student?.phone_number || '',
                                password: '',
                              })}
                                className="flex items-center gap-3 hover:text-blue-600 text-left">
                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {rel.student?.first_name?.[0]}{rel.student?.last_name?.[0]}
                                </span>
                                <span className="font-medium text-gray-900 truncate">
                                  {rel.student?.first_name} {rel.student?.last_name}
                                </span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{rel.student?.phone_number || '-'}</td>
                            <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                              {rel.joined_date ? formatDate(rel.joined_date) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => setEditStudent({
                                  studentId: rel.student_id,
                                  first_name: rel.student?.first_name || '',
                                  last_name: rel.student?.last_name || '',
                                  phone_number: rel.student?.phone_number || '',
                                  password: '',
                                })}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Tahrirlash">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => setRemoveTarget({
                                  studentId: rel.student_id,
                                  name: `${rel.student?.first_name} ${rel.student?.last_name}`
                                })}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Guruhdan chiqarish">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Left students */}
              {leftRelations.length > 0 && !search && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Ketgan o'quvchilar ({leftRelations.length})
                  </h3>
                  <Card className="bg-white/70 backdrop-blur-sm rounded-2xl shadow border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">F.I.O</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Ketgan sana</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {leftRelations.map(rel => (
                            <tr key={rel.id} className="opacity-60">
                              <td className="px-4 py-2.5 text-xs text-gray-600">
                                {rel.student?.first_name} {rel.student?.last_name}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">
                                {rel.left_date ? formatDate(rel.left_date) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Add Students Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { if (!addConfirm && selectedIds.size === 0) setShowAdd(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Student qo'shish
                  </h3>
                  <p className="text-blue-100 text-xs mt-0.5">{selectedGroup?.name}</p>
                </div>
                <button onClick={() => { setAddConfirm(false); setShowAdd(false) }}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!addConfirm ? (
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input value={addSearch} onChange={e => setAddSearch(e.target.value)}
                    placeholder="Ism, telefon bilan qidirish..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500">Sana:</span>
                    <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)}
                      className="w-32 h-7 text-[11px] px-2 border border-gray-200 rounded-lg" />
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                    {selectedIds.size} ta tanlandi
                  </Badge>
                </div>

                {loadingAll ? (
                  <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" /></div>
                ) : filteredAll.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">Studentlar topilmadi</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    {filteredAll.map(s => {
                      const sel = selectedIds.has(Number(s.id))
                      return (
                        <div key={s.id} onClick={() => {
                          const next = new Set(selectedIds)
                          sel ? next.delete(Number(s.id)) : next.add(Number(s.id))
                          setSelectedIds(next)
                        }}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            sel ? "border-blue-500 bg-blue-50/50" : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                          }`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            sel ? "bg-blue-600 border-blue-600" : "border-gray-300"
                          }`}>
                            {sel && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {s.first_name?.[0]}{s.last_name?.[0]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                            <p className="text-[10px] text-gray-400">{s.phone_number || '-'}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center">
                <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
                <p className="text-sm font-semibold text-gray-800 mb-1">{selectedIds.size} ta student qo'shilsinmi?</p>
                <p className="text-xs text-gray-500 mb-4">Guruh: {selectedGroup?.name} | Sana: {formatDate(joinDate)}</p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAddConfirm(false)}
                    className="rounded-xl text-xs h-8 px-4">Qaytish</Button>
                  <Button size="sm" onClick={handleAdd} disabled={submittingAdd}
                    className="rounded-xl text-xs h-8 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                    {submittingAdd ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Qo'shilmoqda...</> : "Ha, qo'shish"}
                  </Button>
                </div>
              </div>
            )}

            {!addConfirm && (
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}
                  className="rounded-xl text-xs h-8 px-4">Bekor qilish</Button>
                <Button size="sm" onClick={() => { if (selectedIds.size > 0) setAddConfirm(true) }}
                  disabled={selectedIds.size === 0}
                  className="rounded-xl text-xs h-8 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  <Plus className="w-3 h-3 mr-1" /> {selectedIds.size} ta qo'shish
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Remove Confirmation ── */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRemoveTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Guruhdan chiqarish</h3>
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">{removeTarget.name}</span> ni guruhdan chiqarasizmi?
              </p>
              <p className="text-xs text-gray-400">O'quvchi "Ketgan" bo'limiga o'tkaziladi</p>
            </div>
            <div className="px-6 pb-6 flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setRemoveTarget(null)}
                className="rounded-xl text-xs h-8 px-5">Bekor qilish</Button>
              <Button size="sm" onClick={handleRemove}
                className="rounded-xl text-xs h-8 px-5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white">
                <Trash2 className="w-3 h-3 mr-1" /> Chiqarish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Student Modal ── */}
      {editStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditStudent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Tahrirlash
                </h3>
                <button onClick={() => setEditStudent(null)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Ism</label>
                <input value={editStudent.first_name}
                  onChange={e => setEditStudent(p => p ? { ...p, first_name: e.target.value } : null)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Familiya</label>
                <input value={editStudent.last_name}
                  onChange={e => setEditStudent(p => p ? { ...p, last_name: e.target.value } : null)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Telefon</label>
                <input value={editStudent.phone_number}
                  onChange={e => setEditStudent(p => p ? { ...p, phone_number: e.target.value } : null)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">
                  Parol <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
                </label>
                <input value={editStudent.password}
                  onChange={e => setEditStudent(p => p ? { ...p, password: e.target.value } : null)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Yangi parol" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditStudent(null)}
                className="rounded-xl text-xs h-8 px-4">Bekor qilish</Button>
              <Button size="sm" onClick={async () => {
                if (!editStudent) return
                setSavingEdit(true)
                try {
                  const p: any = { first_name: editStudent.first_name, last_name: editStudent.last_name, phone_number: editStudent.phone_number }
                  if (editStudent.password) p.password = editStudent.password
                  await api.updateStudent(String(editStudent.studentId), p)
                  setEditStudent(null)
                  await loadStudents()
                } catch {} finally { setSavingEdit(false) }
              }} disabled={savingEdit || !editStudent.first_name.trim() || !editStudent.last_name.trim()}
                className="rounded-xl text-xs h-8 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                {savingEdit ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Saqlanmoqda...</> : <><Check className="w-3 h-3 mr-1" /> Saqlash</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
