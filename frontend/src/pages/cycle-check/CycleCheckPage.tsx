"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Heart,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Brain,
  Target,
  Droplets,
  Sun,
  Moon,
  Zap,
  Shield,
  BookOpen,
  ArrowRight,
  RotateCcw,
} from "lucide-react"
import { format, addDays, differenceInDays } from "date-fns"
import { vi } from "date-fns/locale"

interface CycleData {
  lastPeriodDate: string
  cycleLength: number
  periodLength: number
  symptoms: string[]
  mood: string
  flow: string
  notes: string
}

interface CycleAnalysis {
  currentDay: number
  currentPhase: {
    name: string
    description: string
    icon: React.ReactNode
    color: string
    recommendations: string[]
  }
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
  insights: Array<{
    type: "info" | "warning" | "success"
    title: string
    description: string
    icon: React.ReactNode
  }>
}

const symptoms = [
  "Đau bụng kinh",
  "Đau đầu",
  "Buồn nôn",
  "Mệt mỏi",
  "Căng thẳng",
  "Thay đổi tâm trạng",
  "Đau lưng",
  "Nổi mụn",
  "Tăng cân",
  "Khó ngủ",
]

const CycleCheckPage: React.FC = () => {
  const [step, setStep] = useState<"input" | "analyzing" | "results">("input")
  const [cycleData, setCycleData] = useState<CycleData>({
    lastPeriodDate: "",
    cycleLength: 28,
    periodLength: 5,
    symptoms: [],
    mood: "",
    flow: "",
    notes: "",
  })
  const [analysis, setAnalysis] = useState<CycleAnalysis | null>(null)
  const [progress, setProgress] = useState(0)

  const handleInputChange = (field: keyof CycleData, value: any) => {
    setCycleData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSymptom = (symptom: string) => {
    setCycleData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }))
  }

  const analyzeCycle = async () => {
    setStep("analyzing")
    setProgress(0)

    // Simulate analysis progress
    const progressSteps = [
      { progress: 20, message: "Phân tích ngày chu kỳ hiện tại..." },
      { progress: 40, message: "Xác định giai đoạn chu kỳ..." },
      { progress: 60, message: "Tính toán cửa sổ thụ thai..." },
      { progress: 80, message: "Đánh giá sức khỏe sinh sản..." },
      { progress: 100, message: "Tạo insights cá nhân hóa..." },
    ]

    for (const step of progressSteps) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setProgress(step.progress)
    }

    // Generate analysis
    const lastPeriod = new Date(cycleData.lastPeriodDate)
    const today = new Date()
    const currentDay = differenceInDays(today, lastPeriod) + 1

    const analysisResult = generateCycleAnalysis(cycleData, currentDay)
    setAnalysis(analysisResult)
    setStep("results")
  }

  const generateCycleAnalysis = (data: CycleData, currentDay: number): CycleAnalysis => {
    const lastPeriod = new Date(data.lastPeriodDate)
    const nextPeriod = addDays(lastPeriod, data.cycleLength)
    const daysUntilNext = differenceInDays(nextPeriod, new Date())

    // Determine current phase
    let currentPhase
    if (currentDay <= data.periodLength) {
      currentPhase = {
        name: "Giai đoạn hành kinh",
        description: "Cơ thể đang loại bỏ niêm mạc tử cung. Đây là thời điểm cần nghỉ ngơi và chăm sóc bản thân.",
        icon: <Droplets className="text-red-500" />,
        color: "bg-gradient-to-r from-red-100 to-rose-100",
        recommendations: [
          "Nghỉ ngơi đầy đủ và tránh căng thẳng",
          "Uống nhiều nước ấm và trà thảo mộc",
          "Ăn thực phẩm giàu sắt như rau xanh, thịt đỏ",
          "Tập yoga nhẹ nhàng hoặc đi bộ",
        ],
      }
    } else if (currentDay <= data.cycleLength / 2) {
      currentPhase = {
        name: "Giai đoạn nang trứng",
        description:
          "Năng lượng tăng dần, cơ thể chuẩn bị cho quá trình rụng trứng. Thời điểm tốt để bắt đầu dự án mới.",
        icon: <Sun className="text-yellow-500" />,
        color: "bg-gradient-to-r from-yellow-100 to-orange-100",
        recommendations: [
          "Tận dụng năng lượng cao để làm việc hiệu quả",
          "Tập thể dục cường độ cao",
          "Học hỏi kỹ năng mới",
          "Lên kế hoạch cho các mục tiêu quan trọng",
        ],
      }
    } else if (currentDay <= data.cycleLength / 2 + 3) {
      currentPhase = {
        name: "Giai đoạn rụng trứng",
        description: "Đỉnh cao của chu kỳ với năng lượng dồi dào và tâm trạng tích cực. Thời điểm dễ thụ thai nhất.",
        icon: <Zap className="text-orange-500" />,
        color: "bg-gradient-to-r from-orange-100 to-amber-100",
        recommendations: [
          "Thời điểm tốt nhất cho các hoạt động xã hội",
          "Tập trung vào giao tiếp và thuyết trình",
          "Lưu ý nếu có kế hoạch sinh con",
          "Duy trì chế độ ăn cân bằng",
        ],
      }
    } else {
      currentPhase = {
        name: "Giai đoạn hoàng thể",
        description: "Cơ thể chuẩn bị cho chu kỳ tiếp theo. Có thể cảm thấy mệt mỏi và cần thời gian cho bản thân.",
        icon: <Moon className="text-blue-500" />,
        color: "bg-gradient-to-r from-blue-100 to-indigo-100",
        recommendations: [
          "Tập trung vào self-care và thư giãn",
          "Ăn thực phẩm giàu magie và vitamin B",
          "Hạn chế caffeine và đường",
          "Chuẩn bị tinh thần cho chu kỳ mới",
        ],
      }
    }

    // Calculate fertile window
    const ovulationDay = data.cycleLength - 14
    const fertileStart = addDays(lastPeriod, ovulationDay - 5)
    const fertileEnd = addDays(lastPeriod, ovulationDay + 1)
    const isInFertileWindow = currentDay >= ovulationDay - 5 && currentDay <= ovulationDay + 1

    // Calculate health score
    let healthScore = 70 // Base score
    if (data.cycleLength >= 21 && data.cycleLength <= 35) healthScore += 15
    if (data.periodLength >= 3 && data.periodLength <= 7) healthScore += 10
    if (data.symptoms.length <= 3) healthScore += 5
    healthScore = Math.min(100, healthScore)

    // Generate insights
    const insights = []

    if (data.cycleLength < 21 || data.cycleLength > 35) {
      insights.push({
        type: "warning" as const,
        title: "Chu kỳ bất thường",
        description: "Chu kỳ của bạn ngắn/dài hơn bình thường. Nên tham khảo ý kiến bác sĩ.",
        icon: <AlertTriangle className="text-orange-500" />,
      })
    }

    if (data.symptoms.length > 5) {
      insights.push({
        type: "warning" as const,
        title: "Nhiều triệu chứng",
        description: "Bạn đang trải qua nhiều triệu chứng. Hãy chú ý chăm sóc sức khỏe.",
        icon: <Heart className="text-red-500" />,
      })
    }

    if (isInFertileWindow) {
      insights.push({
        type: "info" as const,
        title: "Giai đoạn dễ thụ thai",
        description: "Bạn đang trong cửa sổ thụ thai. Hãy lưu ý nếu có kế hoạch.",
        icon: <Target className="text-pink-500" />,
      })
    }

    insights.push({
      type: "success" as const,
      title: "Theo dõi tốt",
      description: "Việc theo dõi chu kỳ đều đặn giúp hiểu rõ hơn về cơ thể bạn.",
      icon: <CheckCircle className="text-green-500" />,
    })

    return {
      currentDay,
      currentPhase,
      nextPeriod: {
        date: nextPeriod,
        daysUntil: Math.max(0, daysUntilNext),
      },
      fertileWindow: {
        start: fertileStart,
        end: fertileEnd,
        isActive: isInFertileWindow,
      },
      healthScore,
      insights,
    }
  }

  const resetForm = () => {
    setStep("input")
    setCycleData({
      lastPeriodDate: "",
      cycleLength: 28,
      periodLength: 5,
      symptoms: [],
      mood: "",
      flow: "",
      notes: "",
    })
    setAnalysis(null)
    setProgress(0)
  }

  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-500 mx-auto"></div>
              <Brain className="h-8 w-8 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-800">AI đang phân tích chu kỳ của bạn</h3>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-gray-600">
                {progress < 40 && "Phân tích ngày chu kỳ hiện tại..."}
                {progress >= 40 && progress < 60 && "Xác định giai đoạn chu kỳ..."}
                {progress >= 60 && progress < 80 && "Tính toán cửa sổ thụ thai..."}
                {progress >= 80 && progress < 100 && "Đánh giá sức khỏe sinh sản..."}
                {progress === 100 && "Tạo insights cá nhân hóa..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "results" && analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Kết quả phân tích chu kỳ
              </h1>
              <p className="text-gray-600 mt-2">Insights cá nhân hóa dựa trên dữ liệu của bạn</p>
            </div>
            <Button onClick={resetForm} variant="outline" className="mt-4 md:mt-0 border-purple-200 hover:bg-purple-50">
              <RotateCcw className="h-4 w-4 mr-2" />
              Kiểm tra lại
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Phase */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className={`${analysis.currentPhase.color} border-b`}>
                  <CardTitle className="flex items-center text-xl text-gray-800">
                    <div className="p-2 bg-white/80 rounded-full mr-3">{analysis.currentPhase.icon}</div>
                    {analysis.currentPhase.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-800 mb-2">Ngày {analysis.currentDay}</div>
                      <p className="text-gray-600">{analysis.currentPhase.description}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                        Gợi ý cho giai đoạn này:
                      </h4>
                      <div className="grid gap-2">
                        {analysis.currentPhase.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2 p-2 bg-gray-50 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Predictions */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-800">
                    <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                    Dự đoán
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-100">
                      <div className="flex items-center mb-2">
                        <Droplets className="h-5 w-5 text-red-500 mr-2" />
                        <span className="font-semibold text-gray-800">Kỳ kinh tiếp theo</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(analysis.nextPeriod.date, "EEEE, dd/MM/yyyy", { locale: vi })}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Còn {analysis.nextPeriod.daysUntil} ngày
                      </Badge>
                    </div>

                    <div
                      className={`p-4 rounded-lg border ${
                        analysis.fertileWindow.isActive
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-100"
                          : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <Target className="h-5 w-5 text-emerald-500 mr-2" />
                        <span className="font-semibold text-gray-800">Cửa sổ thụ thai</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {format(analysis.fertileWindow.start, "dd/MM")} -{" "}
                        {format(analysis.fertileWindow.end, "dd/MM/yyyy")}
                      </p>
                      <Badge variant={analysis.fertileWindow.isActive ? "default" : "outline"} className="mt-2 text-xs">
                        {analysis.fertileWindow.isActive ? "Đang hoạt động" : "Không hoạt động"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Health Score */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-800">
                    <Shield className="h-5 w-5 mr-2 text-blue-500" />
                    Điểm Sức Khỏe
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="relative">
                    <div className="text-4xl font-bold text-gray-800">{analysis.healthScore}</div>
                    <div className="text-sm text-gray-500">/ 100 điểm</div>
                  </div>
                  <Progress value={analysis.healthScore} className="h-3" />
                  <Badge
                    className={`${
                      analysis.healthScore >= 80
                        ? "bg-green-100 text-green-700"
                        : analysis.healthScore >= 60
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    } border-0`}
                  >
                    {analysis.healthScore >= 80 ? "Tuyệt vời" : analysis.healthScore >= 60 ? "Tốt" : "Cần cải thiện"}
                  </Badge>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg text-gray-800">
                    <Brain className="h-5 w-5 mr-2 text-purple-500" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        insight.type === "warning"
                          ? "bg-orange-50 border-orange-200"
                          : insight.type === "success"
                            ? "bg-green-50 border-green-200"
                            : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {insight.icon}
                        <div>
                          <h4 className="font-semibold text-sm text-gray-800">{insight.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Kiểm tra chu kỳ kinh nguyệt
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nhập thông tin chu kỳ của bạn để nhận được phân tích chi tiết và gợi ý cá nhân hóa từ AI
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <BookOpen className="h-6 w-6 mr-3" />
                Thông tin chu kỳ của bạn
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-500" />
                    Thông tin cơ bản
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lastPeriod" className="text-sm font-medium text-gray-700">
                        Ngày đầu kỳ kinh gần nhất
                      </Label>
                      <Input
                        id="lastPeriod"
                        type="date"
                        value={cycleData.lastPeriodDate}
                        onChange={(e) => handleInputChange("lastPeriodDate", e.target.value)}
                        className="mt-1 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cycleLength" className="text-sm font-medium text-gray-700">
                          Độ dài chu kỳ (ngày)
                        </Label>
                        <Input
                          id="cycleLength"
                          type="number"
                          min="21"
                          max="40"
                          value={cycleData.cycleLength}
                          onChange={(e) => handleInputChange("cycleLength", Number.parseInt(e.target.value))}
                          className="mt-1 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="periodLength" className="text-sm font-medium text-gray-700">
                          Số ngày hành kinh
                        </Label>
                        <Input
                          id="periodLength"
                          type="number"
                          min="2"
                          max="10"
                          value={cycleData.periodLength}
                          onChange={(e) => handleInputChange("periodLength", Number.parseInt(e.target.value))}
                          className="mt-1 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tâm trạng hiện tại</Label>
                        <Select value={cycleData.mood} onValueChange={(value) => handleInputChange("mood", value)}>
                          <SelectTrigger className="mt-1 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue placeholder="Chọn tâm trạng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="happy">😊 Vui vẻ</SelectItem>
                            <SelectItem value="normal">😐 Bình thường</SelectItem>
                            <SelectItem value="sad">😢 Buồn</SelectItem>
                            <SelectItem value="stressed">😰 Căng thẳng</SelectItem>
                            <SelectItem value="tired">😴 Mệt mỏi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Lượng kinh</Label>
                        <Select value={cycleData.flow} onValueChange={(value) => handleInputChange("flow", value)}>
                          <SelectTrigger className="mt-1 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue placeholder="Chọn mức độ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Ít</SelectItem>
                            <SelectItem value="normal">Bình thường</SelectItem>
                            <SelectItem value="heavy">Nhiều</SelectItem>
                            <SelectItem value="very-heavy">Rất nhiều</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Symptoms & Notes */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-rose-500" />
                    Triệu chứng & Ghi chú
                  </h3>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Triệu chứng bạn đang gặp phải
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {symptoms.map((symptom) => (
                        <Button
                          key={symptom}
                          type="button"
                          variant={cycleData.symptoms.includes(symptom) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => toggleSymptom(symptom)}
                          className={`justify-start text-xs h-10 transition-all duration-200 ${
                            cycleData.symptoms.includes(symptom)
                              ? "bg-purple-100 border-purple-300 text-purple-700"
                              : "border-gray-200 hover:bg-purple-50"
                          }`}
                        >
                          {symptom}
                        </Button>
                      ))}
                    </div>
                    {cycleData.symptoms.length > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {cycleData.symptoms.length} triệu chứng đã chọn
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      Ghi chú thêm (tùy chọn)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Ví dụ: Cảm thấy mệt mỏi hơn bình thường, thay đổi chế độ ăn uống..."
                      value={cycleData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      className="mt-1 border-gray-200 focus:border-purple-500 focus:ring-purple-500 min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  onClick={analyzeCycle}
                  disabled={!cycleData.lastPeriodDate}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  Phân tích chu kỳ với AI
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

<<<<<<< HEAD
export default CycleCheckPage
=======
export default CycleCheckPage 
>>>>>>> 6a5e8ced6369211448e3f8988081b82b3fce476b
