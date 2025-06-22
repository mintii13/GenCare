import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, addDays, format } from "date-fns"
import { vi } from "date-fns/locale"
import type { Period, CycleData } from "../types/health"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date utilities
export function formatDate(date: Date, formatStr = "dd/MM/yyyy"): string {
  return format(date, formatStr, { locale: vi })
}

export function calculateCycleDay(lastPeriodDate: Date, currentDate: Date = new Date()): number {
  return differenceInDays(currentDate, lastPeriodDate) + 1
}

export function calculateNextPeriod(lastPeriodDate: Date, cycleLength: number): Date {
  return addDays(lastPeriodDate, cycleLength)
}

export function calculateFertileWindow(lastPeriodDate: Date, cycleLength: number) {
  const ovulationDay = cycleLength - 14
  const fertileStart = addDays(lastPeriodDate, ovulationDay - 5)
  const fertileEnd = addDays(lastPeriodDate, ovulationDay + 1)

  return {
    start: fertileStart,
    end: fertileEnd,
    ovulationDay: addDays(lastPeriodDate, ovulationDay),
  }
}

// Cycle analysis utilities
export function analyzeCycleRegularity(periods: Period[]): {
  isRegular: boolean
  averageLength: number
  standardDeviation: number
} {
  if (periods.length < 2) {
    return { isRegular: false, averageLength: 28, standardDeviation: 0 }
  }

  const cycleLengths = []
  for (let i = 1; i < periods.length; i++) {
    cycleLengths.push(differenceInDays(periods[i].from, periods[i - 1].from))
  }

  const averageLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
  const variance = cycleLengths.reduce((acc, len) => acc + Math.pow(len - averageLength, 2), 0) / cycleLengths.length
  const standardDeviation = Math.sqrt(variance)

  return {
    isRegular: standardDeviation <= 5,
    averageLength: Math.round(averageLength),
    standardDeviation: Math.round(standardDeviation * 100) / 100,
  }
}

// Health score calculation
export function calculateHealthScore(data: {
  cycleRegularity: number
  trackingConsistency: number
  symptomCount: number
  cycleLength: number
  periodLength: number
  dataPoints: number
}): number {
  let score = 0

  // Cycle regularity (30 points)
  if (data.cycleRegularity <= 2) score += 30
  else if (data.cycleRegularity <= 5) score += 20
  else if (data.cycleRegularity <= 7) score += 10

  // Tracking consistency (25 points)
  score += Math.min(25, (data.trackingConsistency * 25) / 100)

  // Symptom management (20 points)
  if (data.symptomCount <= 2) score += 20
  else if (data.symptomCount <= 4) score += 15
  else if (data.symptomCount <= 6) score += 10
  else score += 5

  // Cycle length health (15 points)
  if (data.cycleLength >= 21 && data.cycleLength <= 35) score += 15
  else if (data.cycleLength >= 18 && data.cycleLength <= 40) score += 10
  else score += 5

  // Data completeness (10 points)
  if (data.dataPoints >= 6) score += 10
  else if (data.dataPoints >= 3) score += 7
  else if (data.dataPoints >= 1) score += 4

  return Math.min(100, Math.round(score))
}

// Validation utilities
export function validateCycleData(data: CycleData): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.lastPeriodDate) {
    errors.push("Vui lòng nhập ngày đầu kỳ kinh gần nhất")
  }

  if (data.cycleLength < 21 || data.cycleLength > 40) {
    errors.push("Độ dài chu kỳ phải từ 21-40 ngày")
  }

  if (data.periodLength < 2 || data.periodLength > 10) {
    errors.push("Số ngày hành kinh phải từ 2-10 ngày")
  }

  if (data.periodLength >= data.cycleLength) {
    errors.push("Số ngày hành kinh không thể lớn hơn hoặc bằng độ dài chu kỳ")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Color utilities for health scores
export function getHealthScoreColor(score: number): {
  color: string
  bgColor: string
  textColor: string
} {
  if (score >= 85) {
    return {
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
      bgColor: "bg-green-100",
      textColor: "text-green-700",
    }
  } else if (score >= 70) {
    return {
      color: "bg-gradient-to-r from-blue-500 to-cyan-500",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    }
  } else if (score >= 55) {
    return {
      color: "bg-gradient-to-r from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-700",
    }
  } else {
    return {
      color: "bg-gradient-to-r from-red-500 to-pink-500",
      bgColor: "bg-red-100",
      textColor: "text-red-700",
    }
  }
}

// Time utilities
export function getTimeUntilNext(time: string): string {
  const now = new Date()
  const [hours, minutes] = time.split(":").map(Number)
  const nextTime = new Date()
  nextTime.setHours(hours, minutes, 0, 0)

  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 1)
  }

  const diff = nextTime.getTime() - now.getTime()
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hoursLeft > 0) {
    return `${hoursLeft}h ${minutesLeft}m`
  }
  return `${minutesLeft}m`
<<<<<<< HEAD
}
=======
} 
>>>>>>> 6a5e8ced6369211448e3f8988081b82b3fce476b
