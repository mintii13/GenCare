import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pill, Clock, Calendar, Sparkles } from "lucide-react"

const MedicationReminderForm: React.FC = () => {
  const [isBirthControl, setIsBirthControl] = useState(false)
  const [medicationName, setMedicationName] = useState("")
  const [time, setTime] = useState("08:00")
  const [frequency, setFrequency] = useState("Hàng ngày")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isBirthControl) {
      setFrequency("Hàng ngày")
      setMedicationName("Thuốc tránh thai hàng ngày")
    } else {
      setMedicationName("")
    }
  }, [isBirthControl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const reminderData = { medicationName, time, frequency }
    console.log("Saving reminder:", reminderData)

    setIsLoading(false)
    alert(`✅ Đã lưu lời nhắc cho: ${medicationName}`)
  }

  return (
    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-xl">
          <Pill className="h-6 w-6 mr-3" />
          Thêm lịch nhắc nhở mới
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Birth Control Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <Label htmlFor="birth-control-switch" className="font-medium text-gray-700">
                Đây là thuốc tránh thai hàng ngày?
              </Label>
            </div>
            <Switch
              id="birth-control-switch"
              checked={isBirthControl}
              onCheckedChange={setIsBirthControl}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>

          {/* Medication Name */}
          <div className="space-y-2">
            <Label htmlFor="medication-name" className="text-sm font-medium text-gray-700">
              Tên thuốc
            </Label>
            <Input
              id="medication-name"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="Ví dụ: Diane-35, Paracetamol..."
              disabled={isBirthControl}
              className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium text-gray-700 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Thời gian uống
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-sm font-medium text-gray-700 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Tần suất
            </Label>
            {isBirthControl ? (
              <Input id="frequency" value={frequency} disabled className="h-12 border-gray-200 bg-gray-50" />
            ) : (
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn tần suất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hàng ngày">Hàng ngày</SelectItem>
                  <SelectItem value="2 lần/ngày">2 lần/ngày</SelectItem>
                  <SelectItem value="3 lần/ngày">3 lần/ngày</SelectItem>
                  <SelectItem value="Mỗi tuần">Mỗi tuần</SelectItem>
                  <SelectItem value="Khi cần thiết">Khi cần thiết</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang lưu...
              </div>
            ) : (
              "Lưu lời nhắc"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

<<<<<<< HEAD
export default MedicationReminderForm
=======
export default MedicationReminderForm
>>>>>>> 6a5e8ced6369211448e3f8988081b82b3fce476b
