"use client"

import type React from "react"
import { useState } from "react"
import { DayPicker, type DateRange } from "react-day-picker"
import { vi } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, X } from "lucide-react"
import type { Period } from "./PeriodCycleCalendar"

interface LogPeriodModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (period: Period) => void
}

const LogPeriodModal: React.FC<LogPeriodModalProps> = ({ isOpen, onClose, onSave }) => {
  const [range, setRange] = useState<DateRange | undefined>()

  if (!isOpen) {
    return null
  }

  const handleSave = () => {
    if (range?.from && range?.to) {
      onSave({ from: range.from, to: range.to })
      onClose()
      setRange(undefined)
    }
  }

  let footer = (
    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <p className="text-sm text-gray-600">📅 Vui lòng chọn ngày bắt đầu chu kỳ.</p>
    </div>
  )

  if (range?.from && !range.to) {
    footer = (
      <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-gray-600">📅 Vui lòng chọn ngày kết thúc chu kỳ.</p>
      </div>
    )
  } else if (range?.from && range?.to) {
    footer = (
      <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <p className="text-sm text-gray-700">
          ✅ <strong>Đã chọn:</strong> {range.from.toLocaleDateString("vi-VN")} đến{" "}
          {range.to.toLocaleDateString("vi-VN")}
        </p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg border-0 shadow-2xl bg-white/95 backdrop-blur-sm animate-in slide-in-from-bottom duration-300">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-xl">
                <Calendar className="h-6 w-6 mr-3" />
                Ghi nhận chu kỳ mới
              </CardTitle>
              <CardDescription className="text-rose-100 mt-1">
                Chọn ngày bắt đầu và ngày kết thúc của kỳ kinh gần nhất
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center p-6">
          <DayPicker
            mode="range"
            locale={vi}
            selected={range}
            onSelect={setRange}
            defaultMonth={new Date()}
            numberOfMonths={1}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-100"
          />
          <div className="mt-4 w-full">{footer}</div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3 p-6 pt-0">
          <Button variant="outline" onClick={onClose} className="border-gray-200 hover:bg-gray-50">
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={!range?.from || !range?.to}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lưu chu kỳ
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

<<<<<<< HEAD
export default LogPeriodModal
=======
export default LogPeriodModal 
>>>>>>> 6a5e8ced6369211448e3f8988081b82b3fce476b
