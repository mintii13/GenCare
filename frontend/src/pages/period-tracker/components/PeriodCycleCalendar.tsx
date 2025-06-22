"use client"

import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { vi } from 'date-fns/locale';

export interface Period {
  from: Date;
  to: Date;
}

interface PeriodCycleCalendarProps {
  periods: Period[];
}

const PeriodCycleCalendar: React.FC<PeriodCycleCalendarProps> = ({ periods }) => {
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>();

  const fertileStyle = {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: "50%",
    border: "2px solid rgba(16, 185, 129, 0.4)",
  };
  
  // Placeholder for fertile window calculation
  const fertileDays: Date[] = [];

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-100">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        locale={vi}
        modifiers={{
          period: periods,
          fertile: fertileDays,
        }}
        modifiersStyles={{
          period: {
            color: "white",
            backgroundColor: "#ef4444",
            borderRadius: "50%",
            fontWeight: "bold",
          },
          fertile: fertileStyle,
          today: {
            fontWeight: "bold",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "50%",
          },
        }}
        className="mx-auto"
        footer={
          selectedDay && (
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-center text-sm text-gray-700">
                <span className="font-medium">Ngày đã chọn:</span> {selectedDay.toLocaleDateString("vi-VN")}
              </p>
            </div>
          )
        }
      />
    </div>
  );
};

<<<<<<< HEAD
export default PeriodCycleCalendar;
=======
export default PeriodCycleCalendar; 
>>>>>>> 6a5e8ced6369211448e3f8988081b82b3fce476b
