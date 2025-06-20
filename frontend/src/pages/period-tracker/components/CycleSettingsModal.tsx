"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, X } from "lucide-react"

interface CycleSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cycleLength: number) => void
  currentCycleLength: number
}

const CycleSettingsModal: React.FC<CycleSettingsModalProps> = ({ isOpen, onClose, onSave, currentCycleLength }) => {
  const [cycleLength, setCycleLength] = useState(currentCycleLength)

  if (!isOpen) {
    return null
  }

  const handleSave = () => {
    onSave(cycleLength)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm animate-in slide-in-from-bottom duration-300">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl">
              <Settings className="h-6 w-6 mr-3" />
              Cài đặt chu kỳ
            </CardTitle>
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
        <CardContent className="p-6">
          <div className="space-y-4">
            <Label htmlFor="cycle-length" className="text-sm font-medium text-gray-700">
              Độ dài chu kỳ trung bình (ngày)
            </Label>
            <Input
              id="cycle-length"
              type="number"
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              placeholder="Ví dụ: 28"
              min="21"
              max="35"
              className="h-12 border-gray-200 focus:border-rose-500 focus:ring-rose-500"
            />
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600 leading-relaxed">
                💡 <strong>Gợi ý:</strong> Chu kỳ kinh nguyệt bình thường từ 21-35 ngày. Nhập độ dài trung bình để có dự
                đoán chính xác hơn.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3 p-6 pt-0">
          <Button variant="outline" onClick={onClose} className="border-gray-200 hover:bg-gray-50">
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Lưu thay đổi
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default CycleSettingsModal 