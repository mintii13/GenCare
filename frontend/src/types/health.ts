import type React from "react"
// Shared TypeScript types for the entire application

export interface MedicationReminder {
  id: string
  userId: string
  medicationName: string
  time: string
  frequency: string
  startDate: string
  isActive?: boolean
  notes?: string
}

export interface Period {
  from: Date
  to: Date
  flow?: "light" | "normal" | "heavy" | "very-heavy"
  symptoms?: string[]
}

export interface CycleData {
  lastPeriodDate: string
  cycleLength: number
  periodLength: number
  symptoms: string[]
  mood: string
  flow: string
  notes: string
}

export interface CyclePhase {
  name: string
  description: string
  icon: React.ReactNode
  color: string
  recommendations: string[]
}

export interface CycleAnalysis {
  currentDay: number
  currentPhase: CyclePhase
  nextPeriod: {
    date: Date
    daysUntil: number
  }
  fertileWindow: {
    start: Date
    end: Date
    isActive: boolean
  }
  healthScore: number
  insights: AIInsight[]
}

export interface AIInsight {
  id: string
  type: "pattern" | "health" | "prediction" | "recommendation" | "info" | "warning" | "success"
  title: string
  description: string
  confidence: number
  priority: "high" | "medium" | "low"
  icon: React.ReactNode
  actionable?: boolean
  action?: string
}

export interface HealthScore {
  overall: number
  cycleRegularity: number
  trackingConsistency: number
  symptomManagement: number
  cycleHealth: number
  dataCompleteness: number
}

export interface UserProfile {
  id: string
  name: string
  email: string
  dateOfBirth?: string
  averageCycleLength: number
  averagePeriodLength: number
  trackingStartDate: string
  preferences: {
    notifications: boolean
    reminderTime: string
    language: "vi" | "en"
    theme: "light" | "dark" | "auto"
  }
}

export interface Symptom {
  id: string
  name: string
  category: "physical" | "emotional" | "other"
  severity?: 1 | 2 | 3 | 4 | 5
  date: Date
}

export type ViewMode = "calendar" | "ring" | "chart"
export type AnalysisStep = "input" | "analyzing" | "results"
export type ReminderFrequency = "daily" | "twice-daily" | "three-times-daily" | "weekly" | "as-needed"