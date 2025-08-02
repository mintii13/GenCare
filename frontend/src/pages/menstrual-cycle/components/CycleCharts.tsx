import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { FaChartLine, FaChartBar } from 'react-icons/fa';
import { menstrualCycleService, CycleStatistics, PeriodStatistics } from '../../../services/menstrualCycleService';
import { toast } from 'react-hot-toast';

const ReactApexChart = lazy(() => import('react-apexcharts'));

interface CycleChartsProps {
  onRefresh?: () => void;
}

const CycleCharts: React.FC<CycleChartsProps> = ({ onRefresh }) => {
  const [cycleStats, setCycleStats] = useState<CycleStatistics | null>(null);
  const [periodStats, setPeriodStats] = useState<PeriodStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      console.log('[CycleCharts] Loading statistics...');
      
      // Load cycle statistics
      try {
        const cycleResponse = await menstrualCycleService.getCycleStatistics();
        console.log('[CycleCharts] Cycle response:', cycleResponse);
        if (cycleResponse.success && cycleResponse.data) {
          setCycleStats(cycleResponse.data);
        } else {
          console.warn('[CycleCharts] Cycle stats failed:', cycleResponse.message);
          setCycleStats(null);
        }
      } catch (cycleError) {
        console.error('[CycleCharts] Cycle stats error:', cycleError);
        setCycleStats(null);
      }

      // Load period statistics  
      try {
        const periodResponse = await menstrualCycleService.getPeriodStatistics();
        console.log('[CycleCharts] Period response:', periodResponse);
        if (periodResponse.success && periodResponse.data) {
          setPeriodStats(periodResponse.data);
        } else {
          console.warn('[CycleCharts] Period stats failed:', periodResponse.message);
          setPeriodStats(null);
        }
      } catch (periodError) {
        console.error('[CycleCharts] Period stats error:', periodError);
        setPeriodStats(null);
      }



    } catch (error) { 
      console.error('[CycleCharts] General error:', error);
      toast.error('Lỗi khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  // Chart 1: Cycle Length Trend
  const cycleChartOptions: any = {
    chart: {
      height: 250,
      type: 'line',
      fontFamily: 'Inter, sans-serif',
      dropShadow: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      enabled: true,
      x: {
        show: false,
      },
      y: {
        formatter: function(value: number) {
          return `${value} ngày`;
        }
      }
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    grid: {
      show: true,
      strokeDashArray: 4,
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      },
    },
    series: [
      {
        name: "Độ dài chu kỳ",
        data: cycleStats?.last_6_cycles?.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(cycle => cycle.length) || [],
        color: "#3b82f6",
      },
      {
        name: "Trung bình",
        data: cycleStats?.last_6_cycles?.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(() => cycleStats?.average_cycle_length) || [],
        color: "#ef4444",
      },
    ],
    legend: {
      show: true,
      position: 'top' as const,
      horizontalAlign: 'left' as const,
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 500,
      labels: {
        colors: '#6b7280'
      }
    },
    xaxis: {
      categories: cycleStats?.last_6_cycles?.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map((cycle, index) => {
        const date = new Date(cycle.start_date);
        return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
      }) || [],
      labels: {
        show: true,
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: '11px',
          colors: '#6b7280'
        },
        rotate: -45,
        rotateAlways: false,
        maxHeight: 60
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: '11px',
          colors: '#6b7280'
        },
        formatter: function(value: number) {
          return `${Math.round(value)} ngày`;
        }
      },
    },
  };

  // Chart 2: Period Length Trend
  const periodChartOptions: any = {
    chart: {
      height: 250,
      type: 'line',
      fontFamily: 'Inter, sans-serif',
      dropShadow: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      enabled: true,
      x: {
        show: false,
      },
      y: {
        formatter: function(value: number) {
          return `${value} ngày`;
        }
      }
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    grid: {
      show: true,
      strokeDashArray: 4,
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      },
    },
    series: [
      {
        name: "Độ dài kinh nguyệt",
        data: periodStats?.last_3_periods?.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(period => period.length) || [],
        color: "#ec4899",
      },
      {
        name: "Trung bình",
        data: periodStats?.last_3_periods?.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(() => periodStats?.average_period_length) || [],
        color: "#ef4444",
      },
    ],
    legend: {
      show: true,
      position: 'top' as const,
      horizontalAlign: 'left' as const,
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 500,
      labels: {
        colors: '#6b7280'
      }
    },
    xaxis: {
      categories: periodStats?.last_3_periods?.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map((period, index) => {
        const date = new Date(period.start_date);
        return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
      }) || [],
      labels: {
        show: true,
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: '11px',
          colors: '#6b7280'
        },
        rotate: -45,
        rotateAlways: false,
        maxHeight: 60
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: '11px',
          colors: '#6b7280'
        },
        formatter: function(value: number) {
          return `${Math.round(value)} ngày`;
        }
      },
    },
  };



  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Đang tải biểu đồ...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Chart 1: Cycle Length Trend */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <FaChartLine className="h-5 w-5 text-blue-600" />
            Xu Hướng Độ Dài Chu Kỳ
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            Biểu đồ theo dõi độ dài chu kỳ qua thời gian
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {cycleStats?.last_6_cycles && cycleStats.last_6_cycles.length > 0 ? (
            <Suspense fallback={<div className="text-center py-6">Đang tải biểu đồ...</div>}>
              <ReactApexChart
                options={cycleChartOptions}
                series={cycleChartOptions.series}
                type="line"
                height={250}
              />
            </Suspense>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FaChartLine className="text-3xl mx-auto mb-2 text-gray-300" />
              <p className="text-xs">Chưa có đủ dữ liệu</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Period Length Trend */}
      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <FaChartBar className="h-5 w-5 text-pink-600" />
            Xu Hướng Độ Dài Kinh Nguyệt
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            Biểu đồ theo dõi độ dài kinh nguyệt qua thời gian
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {periodStats?.last_3_periods && periodStats.last_3_periods.length > 0 ? (
            <Suspense fallback={<div className="text-center py-6">Đang tải biểu đồ...</div>}>
              <ReactApexChart
                options={periodChartOptions}
                series={periodChartOptions.series}
                type="line"
                height={250}
              />
            </Suspense>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <FaChartBar className="text-3xl mx-auto mb-2 text-gray-300" />
              <p className="text-xs">Chưa có đủ dữ liệu</p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default CycleCharts; 