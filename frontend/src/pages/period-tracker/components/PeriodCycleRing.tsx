"use client"

import type React from "react"

interface CycleRingProps {
  cycleLength: number
  periodLength: number
  currentDay: number
}

const PeriodCycleRing: React.FC<CycleRingProps> = ({ cycleLength, periodLength, currentDay }) => {
  const size = 280
  const strokeWidth = 24
  const center = size / 2
  const radius = center - strokeWidth

  const dayToAngle = (day: number) => (day / cycleLength) * 360

  const periodEndAngle = dayToAngle(periodLength)
  const fertileStartAngle = dayToAngle(11)
  const fertileEndAngle = dayToAngle(16)
  const currentDayAngle = dayToAngle(currentDay)

  const indicatorX = center + radius * Math.cos((currentDayAngle - 90) * (Math.PI / 180))
  const indicatorY = center + radius * Math.sin((currentDayAngle - 90) * (Math.PI / 180))

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = {
      x: x + radius * Math.cos(((startAngle - 90) * Math.PI) / 180),
      y: y + radius * Math.sin(((startAngle - 90) * Math.PI) / 180),
    }
    const end = {
      x: x + radius * Math.cos(((endAngle - 90) * Math.PI) / 180),
      y: y + radius * Math.sin(((endAngle - 90) * Math.PI) / 180),
    }

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(" ")

    return d
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </linearGradient>
            <linearGradient id="periodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="fertileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          <circle cx={center} cy={center} r={radius} fill="none" stroke="url(#bgGradient)" strokeWidth={strokeWidth} />

          {/* Period arc */}
          <path
            d={describeArc(center, center, radius, 0, periodEndAngle)}
            fill="none"
            stroke="url(#periodGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="drop-shadow-sm"
          />

          {/* Fertile window arc */}
          <path
            d={describeArc(center, center, radius, fertileStartAngle, fertileEndAngle)}
            fill="none"
            stroke="url(#fertileGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="drop-shadow-sm"
          />

          {/* Current day indicator */}
          <circle
            cx={indicatorX}
            cy={indicatorY}
            r={strokeWidth / 2 + 4}
            fill="#3b82f6"
            stroke="white"
            strokeWidth="3"
            className="drop-shadow-lg animate-pulse"
          />

          {/* Center text */}
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dy=".3em"
            fontSize="3rem"
            fontWeight="bold"
            fill="#1f2937"
            className="font-mono"
          >
            {currentDay > 0 ? currentDay : "?"}
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dy=".3em"
            fontSize="0.9rem"
            fill="#6b7280"
            className="uppercase tracking-wide"
          >
            Ngày
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-sm"></div>
          <span className="text-sm font-medium text-gray-700">Hành kinh</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm"></div>
          <span className="text-sm font-medium text-gray-700">Dễ thụ thai</span>
        </div>
      </div>
    </div>
  )
}

export default PeriodCycleRing