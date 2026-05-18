// components/AttendanceSelector.tsx
"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AttendanceSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (present: boolean) => void
  disabled?: boolean
}

export function AttendanceSelector({ open, onOpenChange, onSelect, disabled }: AttendanceSelectorProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button className="hidden" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1" align="center" side="bottom">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700"
            onClick={() => {
              onSelect(true)
              onOpenChange(false)
            }}
            disabled={disabled}
          >
            <Check className="h-5 w-5 text-white" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700"
            onClick={() => {
              onSelect(false)
              onOpenChange(false)
            }}
            disabled={disabled}
          >
            <X className="h-5 w-5 text-white" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}