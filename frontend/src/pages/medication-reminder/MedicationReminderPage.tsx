"use client"

import type React from "react"
import { useState } from "react"
import MedicationReminderForm from "./components/MedicationReminderForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BellRing, Trash2, Edit, PlusCircle, Clock, Calendar, Sparkles } from "lucide-react"
import type { MedicationReminder } from "@/types/health"

const MedicationReminderPage: React.FC = () => {
  const [reminders, setReminders] = useState<MedicationReminder[]>([
    {
      id: "1",
      userId: "user1",
      medicationName: "Thuốc tránh thai Diane-35",
      time: "08:00",
      frequency: "Hàng ngày",
      startDate: "2024-06-01",
    },
    {
      id: "2",
      userId: "user1",
      medicationName: "Vitamin tổng hợp",
      time: "08:00",
      frequency: "Hàng ngày",
      startDate: "2024-05-15",
    },
  ])
  const [showForm, setShowForm] = useState(false)

  const handleDelete = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id))
  }

  const getTimeUntilNext = (time: string) => {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lời nhắc của tôi
            </h1>
            <p className="text-gray-600 mt-2">Quản lý lịch uống thuốc một cách thông minh</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            {showForm ? "Đóng Form" : "Thêm lời nhắc"}
          </Button>
        </div>

        {/* Highlight Card for Birth Control */}
        {!showForm && (
          <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                <BellRing className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-800">Không bao giờ quên thuốc tránh thai</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Thiết lập lời nhắc hàng ngày chỉ với một cú nhấp chuột.
                </CardDescription>
              </div>
              <Sparkles className="w-6 h-6 text-purple-500" />
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                Thiết lập ngay
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Form for adding/editing reminders */}
        {showForm && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <MedicationReminderForm />
          </div>
        )}

        {/* List of current reminders */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800">Danh sách đang theo dõi</h2>
            <Badge variant="secondary" className="text-sm">
              {reminders.length} lời nhắc
            </Badge>
          </div>

          {reminders.length > 0 ? (
            <div className="grid gap-4">
              {reminders.map((reminder, index) => (
                <Card
                  key={reminder.id}
                  className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                          <BellRing className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                            {reminder.medicationName}
                          </h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span className="font-medium">{reminder.time}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{reminder.frequency}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Còn {getTimeUntilNext(reminder.time)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(reminder.id)}
                          className="hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
              <CardContent className="text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <BellRing className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có lời nhắc nào</h3>
                <p className="text-gray-500 mb-6">Hãy tạo lời nhắc đầu tiên để bắt đầu quản lý lịch uống thuốc</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Tạo lời nhắc đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

<<<<<<< HEAD
export default MedicationReminderPage
=======
export default MedicationReminderPage 
>>>>>>> 6a5e8ced6369211448e3f8988081b82b3fce476b
