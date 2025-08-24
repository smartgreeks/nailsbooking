"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { el } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

function DatePicker({
  date,
  onSelect,
  disabled = false,
  placeholder = "Επιλέξτε ημερομηνία",
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate)
    setOpen(false)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    // Format as DD/MM/YYYY for Greek locale
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDate(date) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={(date) => {
              // Disable past dates
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return date < today
            }}
            initialFocus
            locale={el}
            formatters={{
              formatCaption: (date, options) => {
                return format(date, "LLLL yyyy", { locale: el, ...options })
              },
              formatWeekdayName: (date, options) => {
                return format(date, "EEEEEE", { locale: el, ...options })
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export { DatePicker }