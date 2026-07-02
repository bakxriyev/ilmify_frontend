"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, X } from "lucide-react"

interface AttendanceSelectorProps {
  open: boolean
  anchorEl: HTMLElement | null
  onOpenChange: (open: boolean) => void
  onSelect: (present: boolean) => void
  disabled?: boolean
}

export function AttendanceSelector({ open, anchorEl, onOpenChange, onSelect, disabled }: AttendanceSelectorProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + rect.width / 2,
      })
    }
  }, [open, anchorEl])

  useEffect(() => {
    if (!open) return
    const handleClose = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        onOpenChange(false)
        return
      }
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    const id = setTimeout(() => {
      document.addEventListener("mousedown", handleClose)
      document.addEventListener("keydown", handleClose as any)
    }, 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener("mousedown", handleClose)
      document.removeEventListener("keydown", handleClose as any)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 p-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="flex gap-1">
        <button
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 shadow-md transition-all hover:scale-110 active:scale-95"
          onClick={() => onSelect(true)}
          disabled={disabled}
        >
          <Check className="w-5 h-5 text-white" />
        </button>
        <button
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 shadow-md transition-all hover:scale-110 active:scale-95"
          onClick={() => onSelect(false)}
          disabled={disabled}
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>,
    document.body
  )
}
