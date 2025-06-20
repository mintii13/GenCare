"use client"

import type React from "react"
import { useState } from "react"
import PeriodCycleCalendar, { type Period } from "./components/PeriodCycleCalendar"
import PeriodCycleRing from "./components/PeriodCycleRing"
import CyclePhaseInfo from "./components/CyclePhaseInfo"
import SymptomLogger from "./components/SymptomLogger"
import CycleSettingsModal from "./components/CycleSettingsModal"
import LogPeriodModal from "./components/LogPeriodModal"
import HealthScore from "./components/HealthScore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { addDays, format, differenceInDays } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar, Circle, Plus, Droplets, Sun, Settings, Heart, TrendingUp, BarChart2 } from "lucide-react"

type ViewMode = "calendar" | "ring"

const PeriodCycleTrackerPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("ring")
  const [periods, setPeriods] = useState<Period[]>([
    { from: new Date(2024, 4, 28), to: new Date(2024, 5, 2) },
    { from: new Date(2024, 5, 26), to: new Date(2024, 5, 30) },
  ])
  const [userCycleLength, setUserCycleLength] = useState<number>(28)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isLogPeriodModalOpen, setIsLogPeriodModalOpen] = useState(false)
  const [loggedSymptoms, setLoggedSymptoms] = useState<string[]>([])

  const handleSaveNewPeriod = (newPeriod: Period) => {
    const updatedPeriods = [...periods, newPeriod].sort((a, b) => a.from.getTime() - b.from.getTime())
    setPeriods(updatedPeriods)
  }

  const handleSaveSettings = (newLength: number) => {
    setUserCycleLength(newLength)
  }

  // Cycle Calculation Logic
  const lastPeriod = periods.length > 0 ? periods[periods.length - 1] : null
  const calculatedCycleLength =
    lastPeriod && periods.length > 1 ? differenceInDays(lastPeriod.from, periods[periods.length - 2].from) : 28

  const cycleLength = userCycleLength || calculatedCycleLength
  const periodLength = lastPeriod ? differenceInDays(lastPeriod.to, lastPeriod.from) + 1 : 5
  const currentDayOfCycle = lastPeriod ? differenceInDays(new Date(), lastPeriod.from) + 1 : 0

  const nextPeriodStart = lastPeriod ? addDays(lastPeriod.from, cycleLength) : null
  const ovulationDay = lastPeriod ? addDays(lastPeriod.from, cycleLength - 14) : null
  const fertileWindowStart = ovulationDay ? addDays(ovulationDay, -5) : null
  const fertileWindowEnd = ovulationDay ? addDays(ovulationDay, 1) : null

  const daysUntilNextPeriod = nextPeriodStart ? differenceInDays(nextPeriodStart, new Date()) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Chu kỳ của bạn
            </h1>
            <div className="flex items-center space-x-4 mt-3">
              <Badge variant="secondary" className="flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Chu kỳ {cycleLength} ngày
              </Badge>
              {daysUntilNextPeriod > 0 && (
                <Badge variant="outline" className="flex items-center text-rose-600 border-rose-200">
                  <Heart className="h-3 w-3 mr-1" />
                  Còn {daysUntilNextPeriod} ngày
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setIsLogPeriodModalOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ghi nhận chu kỳ
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
              className="border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors"
            >
              <Settings className="h-5 w-5 text-rose-600" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column: Visualization */}
          <div className="lg:col-span-3 space-y-8">
             <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-gray-800">Tổng quan chu kỳ</CardTitle>
                <div className="flex items-center rounded-lg bg-gray-100 p-1">
                  <Button
                    variant={viewMode === "ring" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("ring")}
                    className="transition-all duration-200"
                  >
                    <Circle className="h-4 w-4 mr-2" /> Vòng tròn
                  </Button>
                  <Button
                    variant={viewMode === "calendar" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("calendar")}
                    className="transition-all duration-200"
                  >
                    <Calendar className="h-4 w-4 mr-2" /> Lịch
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8">
                <div className="transition-all duration-500 ease-in-out">
                  {viewMode === "calendar" ? (
                    <PeriodCycleCalendar periods={periods} />
                  ) : (
                    <PeriodCycleRing
                      cycleLength={cycleLength}
                      periodLength={periodLength}
                      currentDay={currentDayOfCycle}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Health Score Component */}
            <HealthScore periods={periods} cycleLength={cycleLength} symptoms={loggedSymptoms} trackingConsistency={75} />

          </div>

          {/* Right Column: Information & Actions */}
          <div className="lg:col-span-2 space-y-6">
            <CyclePhaseInfo currentDay={currentDayOfCycle} cycleLength={cycleLength} periodLength={periodLength} />

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg text-gray-800">
                  <BarChart2 className="h-5 w-5 mr-2 text-rose-500" />
                  Dự đoán
                </CardTitle>
                <CardDescription>Các mốc quan trọng sắp tới</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextPeriodStart && (
                  <div className="flex items-center p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-100">
                    <div className="p-2 bg-red-100 rounded-full mr-3">
                      <Droplets className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Kỳ kinh tiếp theo</p>
                      <p className="text-sm text-gray-600">
                        {format(nextPeriodStart, "EEEE, dd/MM/yyyy", { locale: vi })}
                      </p>
                    </div>
                  </div>
                )}
                {fertileWindowStart && fertileWindowEnd && (
                  <div className="flex items-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
                    <div className="p-2 bg-emerald-100 rounded-full mr-3">
                      <Sun className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Giai đoạn dễ thụ thai</p>
                      <p className="text-sm text-gray-600">
                        {`${format(fertileWindowStart, "dd/MM")} - ${format(fertileWindowEnd, "dd/MM/yyyy")}`}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <SymptomLogger onSymptomsChange={setLoggedSymptoms} />
          </div>
        </div>

        <CycleSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveSettings}
          currentCycleLength={cycleLength}
        />
        <LogPeriodModal
          isOpen={isLogPeriodModalOpen}
          onClose={() => setIsLogPeriodModalOpen(false)}
          onSave={handleSaveNewPeriod}
        />
      </div>
    </div>
  )
}

export default PeriodCycleTrackerPage 