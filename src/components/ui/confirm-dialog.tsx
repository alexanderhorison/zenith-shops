"use client"

import { ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LucideIcon } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  icon: LucideIcon
  iconClassName?: string
  iconBgClassName?: string
  confirmText?: string
  confirmClassName?: string
  cancelText?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  icon: Icon,
  iconClassName = "h-6 w-6 text-red-600",
  iconBgClassName = "bg-red-100",
  confirmText = "Confirm",
  confirmClassName = "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false)
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[400px] w-[90%] rounded-2xl p-6 gap-6">
        <AlertDialogHeader className="flex flex-col items-center gap-4 space-y-0">
          {/* Icon Circle */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl mx-auto ${iconBgClassName}`}>
            <Icon className={`shrink-0 ${iconClassName}`} />
          </div>

          <div className="space-y-1 text-center">
            <AlertDialogTitle className="text-xl font-semibold text-foreground">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {/* Buttons Grid - 50% width each */}
        <AlertDialogFooter className="grid grid-cols-2 gap-3 sm:justify-center sm:space-x-0">
          <AlertDialogCancel className="mt-0 w-full rounded-xl border-0 bg-gray-100 text-gray-900 hover:bg-gray-200">
            {cancelText}
          </AlertDialogCancel>
          
          <AlertDialogAction
            onClick={handleConfirm}
            className={`w-full rounded-xl shadow-none border-0 ${confirmClassName}`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
