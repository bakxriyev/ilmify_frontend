// components/ReasonDialog.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface ReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reason: string) => void
  studentName: string
}

export function ReasonDialog({ open, onOpenChange, onSubmit, studentName }: ReasonDialogProps) {
  const [reason, setReason] = useState("")

  const handleSubmit = () => {
    onSubmit(reason)
    setReason("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sabab kiriting</DialogTitle>
          <DialogDescription>
            {studentName} darsga kelmaganligi sababini yozing.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Sabab..."
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={!reason.trim()}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}