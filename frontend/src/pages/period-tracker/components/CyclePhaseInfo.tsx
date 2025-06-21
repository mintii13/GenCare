"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sun, Moon, Droplets, Sparkles } from "lucide-react"

interface CyclePhaseInfoProps {
  currentDay: number
  cycleLength: number
  periodLength: number
}

const CyclePhaseInfo: React.FC<CyclePhaseInfoProps> = ({ currentDay, cycleLength, periodLength }) => {
  const getPhase = () => {
    if (currentDay <= 0)
      return {
        name: "Chưa có dữ liệu",
        icon: <Moon className="text-gray-400" />,
        description: "Hãy bắt đầu ghi lại chu kỳ của bạn.",
        color: "bg-gray-100",
        textColor: "text-gray-600",
      }
    if (currentDay <= periodLength)
      return {
        name: "Đang hành kinh",
        icon: <Droplets className="text-red-500" />,
        description: "Giai đoạn cơ thể đang loại bỏ niêm mạc tử cung.",
        color: "bg-gradient-to-r from-red-100 to-rose-100",
        textColor: "text-red-600",
      }
    if (currentDay <= cycleLength / 2)
      return {
        name: "Giai đoạn nang trứng",
        icon: <Sun className="text-yellow-500" />,
        description: "Năng lượng tăng dần, cơ thể chuẩn bị rụng trứng.",
        color: "bg-gradient-to-r from-yellow-100 to-orange-100",
        textColor: "text-yellow-600",
      }
    if (currentDay <= cycleLength / 2 + 3)
      return {
        name: "Rụng trứng",
        icon: <Sparkles className="text-orange-500" />,
        description: "Thời điểm dễ thụ thai nhất trong chu kỳ.",
        color: "bg-gradient-to-r from-orange-100 to-amber-100",
        textColor: "text-orange-600",
      }
    return {
      name: "Giai đoạn hoàng thể",
      icon: <Moon className="text-blue-500" />,
      description: "Cơ thể chuẩn bị cho kỳ kinh tiếp theo.",
      color: "bg-gradient-to-r from-blue-100 to-indigo-100",
      textColor: "text-blue-600",
    }
  }

  const phase = getPhase()

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
      <CardHeader className={`${phase.color} border-b`}>
        <CardTitle className="flex items-center gap-3 text-gray-800">
          <div className="p-2 bg-white/80 rounded-full">{phase.icon}</div>
          <span>Trạng thái hôm nay</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-5xl font-bold text-gray-800">{currentDay > 0 ? `${currentDay}` : "?"}</p>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Ngày trong chu kỳ</p>
          </div>

          <Badge variant="secondary" className={`${phase.textColor} text-lg px-4 py-2 font-medium`}>
            {phase.name}
          </Badge>

          <p className="text-sm text-gray-600 leading-relaxed px-2">{phase.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default CyclePhaseInfo