"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Shield, TrendingUp, Award, Star } from "lucide-react"
import type { Period } from "./PeriodCycleCalendar"

interface HealthScoreProps {
  periods: Period[]
  cycleLength: number
  symptoms: string[]
  trackingConsistency: number
}

const HealthScore: React.FC<HealthScoreProps> = ({ periods, cycleLength, symptoms, trackingConsistency }) => {
  const calculateHealthScore = () => {
    let score = 0
    const maxScore = 100

    // Cycle regularity (30 points)
    if (periods.length >= 3) {
      const cycleLengths = []
      for (let i = 1; i < periods.length; i++) {
        const diff = Math.abs(periods[i].from.getTime() - periods[i - 1].from.getTime()) / (1000 * 60 * 60 * 24)
        cycleLengths.push(diff)
      }

      const avgCycle = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
      const variance = cycleLengths.reduce((acc, len) => acc + Math.pow(len - avgCycle, 2), 0) / cycleLengths.length
      const standardDeviation = Math.sqrt(variance)

      if (standardDeviation <= 2) score += 30
      else if (standardDeviation <= 5) score += 20
      else if (standardDeviation <= 7) score += 10
    }

    // Tracking consistency (25 points)
    score += Math.min(25, (trackingConsistency * 25) / 100)

    // Symptom management (20 points)
    const negativeSymptoms = symptoms.filter((s) => ["cramps", "headache", "sad"].includes(s)).length
    const totalSymptoms = symptoms.length
    if (totalSymptoms > 0) {
      const positiveRatio = (totalSymptoms - negativeSymptoms) / totalSymptoms
      score += positiveRatio * 20
    } else {
      score += 15 // Default if no symptoms tracked
    }

    // Cycle length health (15 points)
    if (cycleLength >= 21 && cycleLength <= 35) {
      score += 15
    } else if (cycleLength >= 18 && cycleLength <= 40) {
      score += 10
    } else {
      score += 5
    }

    // Data completeness (10 points)
    if (periods.length >= 6) score += 10
    else if (periods.length >= 3) score += 7
    else if (periods.length >= 1) score += 4

    return Math.min(100, Math.round(score))
  }

  const getScoreLevel = (score: number) => {
    if (score >= 85)
      return {
        level: "Xuất sắc",
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: <Award className="h-4 w-4" />,
      }
    if (score >= 70)
      return { level: "Tốt", color: "text-blue-600", bgColor: "bg-blue-100", icon: <Star className="h-4 w-4" /> }
    if (score >= 55)
      return {
        level: "Trung bình",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        icon: <TrendingUp className="h-4 w-4" />,
      }
    return {
      level: "Cần cải thiện",
      color: "text-red-600",
      bgColor: "bg-red-100",
      icon: <Shield className="h-4 w-4" />,
    }
  }

  const score = calculateHealthScore()
  const scoreLevel = getScoreLevel(score)

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-gradient-to-r from-green-500 to-emerald-500"
    if (score >= 70) return "bg-gradient-to-r from-blue-500 to-cyan-500"
    if (score >= 55) return "bg-gradient-to-r from-yellow-500 to-orange-500"
    return "bg-gradient-to-r from-red-500 to-pink-500"
  }

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg text-gray-800">
          <Shield className="h-5 w-5 mr-2 text-blue-500" />
          Điểm Sức Khỏe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="text-4xl font-bold text-gray-800">{score}</div>
            <div className="text-sm text-gray-500">/ 100 điểm</div>
          </div>

          <Badge className={`${scoreLevel.bgColor} ${scoreLevel.color} border-0 px-3 py-1`}>
            {scoreLevel.icon}
            <span className="ml-1 font-medium">{scoreLevel.level}</span>
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tiến độ</span>
            <span className="font-medium">{score}%</span>
          </div>
          <div className="relative">
            <Progress value={score} className="h-3" />
            <div
              className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ${getScoreColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Chu kỳ đều đặn</div>
            <div className="text-gray-500">{periods.length >= 3 ? "✓ Đã đánh giá" : "Cần thêm dữ liệu"}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Theo dõi đều</div>
            <div className="text-gray-500">{trackingConsistency}% hoàn thành</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Quản lý triệu chứng</div>
            <div className="text-gray-500">
              {symptoms.length > 0 ? `${symptoms.length} triệu chứng` : "Chưa ghi nhận"}
            </div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Chu kỳ khỏe mạnh</div>
            <div className="text-gray-500">
              {cycleLength >= 21 && cycleLength <= 35 ? "✓ Bình thường" : "Cần chú ý"}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-600 text-center">
            💡 Điểm số được tính dựa trên tính đều đặn của chu kỳ, việc theo dõi và quản lý sức khỏe tổng thể
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default HealthScore 