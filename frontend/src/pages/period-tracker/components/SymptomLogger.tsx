"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Waves, Smile, Meh, Frown, Snowflake, Thermometer, Heart, CheckCircle } from "lucide-react"

const symptoms = [
  { id: "cramps", name: "Đau bụng", icon: <Waves />, color: "hover:bg-red-50 hover:border-red-200" },
  { id: "headache", name: "Đau đầu", icon: <Thermometer />, color: "hover:bg-orange-50 hover:border-orange-200" },
  { id: "happy", name: "Vui vẻ", icon: <Smile />, color: "hover:bg-green-50 hover:border-green-200" },
  { id: "neutral", name: "Bình thường", icon: <Meh />, color: "hover:bg-gray-50 hover:border-gray-200" },
  { id: "sad", name: "Buồn", icon: <Frown />, color: "hover:bg-blue-50 hover:border-blue-200" },
  { id: "acne", name: "Nổi mụn", icon: <Snowflake />, color: "hover:bg-purple-50 hover:border-purple-200" },
]

interface SymptomLoggerProps {
  onSymptomsChange?: (symptoms: string[]) => void
}

const SymptomLogger: React.FC<SymptomLoggerProps> = ({ onSymptomsChange }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set())
  const [isSaved, setIsSaved] = useState(false)

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(symptomId)) {
        newSet.delete(symptomId)
      } else {
        newSet.add(symptomId)
      }
      return newSet
    })
    setIsSaved(false)
  }

  const handleSave = () => {
    setIsSaved(true)
    if (onSymptomsChange) {
      onSymptomsChange(Array.from(selectedSymptoms))
    }
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg text-gray-800">
            <Heart className="h-5 w-5 mr-2 text-rose-500" />
            Triệu chứng hôm nay
          </CardTitle>
          {selectedSymptoms.size > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedSymptoms.size} triệu chứng
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {symptoms.map((symptom) => (
            <Button
              key={symptom.id}
              variant={selectedSymptoms.has(symptom.id) ? "secondary" : "outline"}
              className={`flex flex-col h-20 transition-all duration-200 ${symptom.color} ${
                selectedSymptoms.has(symptom.id) ? "bg-rose-100 border-rose-300 text-rose-700" : "border-gray-200"
              }`}
              onClick={() => toggleSymptom(symptom.id)}
            >
              <div className="mb-1">{symptom.icon}</div>
              <span className="text-xs font-medium">{symptom.name}</span>
            </Button>
          ))}
        </div>

        <Button
          className={`w-full h-12 transition-all duration-300 ${
            isSaved
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          } text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105`}
          onClick={handleSave}
          disabled={selectedSymptoms.size === 0}
        >
          {isSaved ? (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Đã lưu!
            </div>
          ) : (
            "Lưu triệu chứng"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default SymptomLogger 