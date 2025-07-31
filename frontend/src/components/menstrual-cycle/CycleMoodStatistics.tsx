// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
// import { Button } from '../ui/button';
// import { Badge } from '../ui/badge';
// import { 
//   FaChartLine, 
//   FaSmile, 
//   FaFrown, 
//   FaMeh, 
//   FaBolt, 
//   FaThermometerHalf, 
//   FaHeart,
//   FaRegCircle,
//   FaArrowUp,
//   FaArrowDown,
//   FaMinus,
//   FaCalendarAlt,
//   FaTrendingUp,
//   FaTrendingDown
// } from 'react-icons/fa';
// import { menstrualCycleService, PeriodMoodStatistics, CycleComparison } from '../../services/menstrualCycleService';
// import { toast } from 'react-hot-toast';

// interface CycleMoodStatisticsProps {
//   cycleId?: string;
//   onRefresh?: () => void;
// }

// const CycleMoodStatistics: React.FC<CycleMoodStatisticsProps> = ({ 
//   cycleId, 
//   onRefresh 
// }) => {
//   const [statistics, setStatistics] = useState<PeriodMoodStatistics | null>(null);
//   const [comparison, setComparison] = useState<CycleComparison | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState<'current' | 'comparison'>('current');

//   useEffect(() => {
//     loadStatistics();
//     loadComparison();
//   }, [cycleId]);

//   const loadStatistics = async () => {
//     setLoading(true);
//     try {
//       const response = await menstrualCycleService.getCycleMoodStatistics(cycleId);
//       if (response.success && response.data) {
//         setStatistics(response.data);
//       }
//     } catch (error) {
//       console.error('Error loading statistics:', error);
//       toast.error('Không thể tải thống kê');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadComparison = async () => {
//     try {
//       const response = await menstrualCycleService.getCycleComparison();
//       if (response.success && response.data) {
//         setComparison(response.data);
//       }
//     } catch (error) {
//       console.error('Error loading comparison:', error);
//     }
//   };

//   const getMoodIcon = (mood: string) => {
//     switch (mood) {
//       case 'happy': return <FaSmile className="text-yellow-500" />;
//       case 'sad': return <FaFrown className="text-blue-500" />;
//       case 'tired': return <FaMeh className="text-gray-500" />;
//       case 'excited': return <FaSmile className="text-orange-500" />;
//       case 'calm': return <FaRegCircle className="text-green-500" />;
//       case 'stressed': return <FaFrown className="text-red-500" />;
//       default: return <FaMeh className="text-gray-400" />;
//     }
//   };

//   const getEnergyIcon = (energy: string) => {
//     switch (energy) {
//       case 'high': return <FaBolt className="text-yellow-500" />;
//       case 'medium': return <FaThermometerHalf className="text-orange-500" />;
//       case 'low': return <FaHeart className="text-red-500" />;
//       default: return <FaThermometerHalf className="text-gray-400" />;
//     }
//   };

//   const getTrendIcon = (trend: string) => {
//     switch (trend) {
//       case 'improving': return <FaTrendingUp className="text-green-500" />;
//       case 'declining': return <FaTrendingDown className="text-red-500" />;
//       case 'stable': return <FaMinus className="text-gray-500" />;
//       default: return <FaMinus className="text-gray-400" />;
//     }
//   };

//   const getTrendLabel = (trend: string) => {
//     switch (trend) {
//       case 'improving': return 'Cải thiện';
//       case 'declining': return 'Giảm sút';
//       case 'stable': return 'Ổn định';
//       default: return 'Không xác định';
//     }
//   };

//   if (loading) {
//     return (
//       <Card>
//         <CardContent className="p-6">
//           <div className="flex items-center justify-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
//             <span className="ml-2">Đang tải thống kê...</span>
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <FaChartLine className="text-pink-500" />
//           Thống Kê Cảm Xúc Chu Kỳ
//         </CardTitle>
//       </CardHeader>
//       <CardContent>
//         {/* Tab Navigation */}
//         <div className="flex gap-2 mb-4">
//           <Button
//             variant={activeTab === 'current' ? 'default' : 'outline'}
//             size="sm"
//             onClick={() => setActiveTab('current')}
//           >
//             <FaCalendarAlt className="mr-2" />
//             Chu Kỳ Hiện Tại
//           </Button>
//           <Button
//             variant={activeTab === 'comparison' ? 'default' : 'outline'}
//             size="sm"
//             onClick={() => setActiveTab('comparison')}
//           >
//             <FaTrendingUp className="mr-2" />
//             So Sánh Chu Kỳ
//           </Button>
//         </div>

//         {activeTab === 'current' && statistics && (
//           <div className="space-y-6">
//             {/* Overview */}
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
//                 <div className="text-2xl font-bold text-pink-600">{statistics.total_period_days}</div>
//                 <div className="text-sm text-gray-600">Tổng ngày kinh</div>
//               </div>
//               <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
//                 <div className="text-2xl font-bold text-blue-600">{statistics.days_with_mood_data}</div>
//                 <div className="text-sm text-gray-600">Ngày có ghi chú</div>
//               </div>
//               <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
//                 <div className="text-2xl font-bold text-green-600">
//                   {getMoodIcon(statistics.average_mood)}
//                 </div>
//                 <div className="text-sm text-gray-600">Tâm trạng TB</div>
//               </div>
//               <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
//                 <div className="text-2xl font-bold text-yellow-600">
//                   {getTrendIcon(statistics.mood_trend)}
//                 </div>
//                 <div className="text-sm text-gray-600">Xu hướng</div>
//               </div>
//             </div>

//             {/* Mood Distribution */}
//             <div className="space-y-4">
//               <h3 className="font-semibold text-gray-800">Phân Bố Tâm Trạng</h3>
//               <div className="bg-gray-50 p-4 rounded-lg">
//                 <div className="flex items-center gap-2 mb-2">
//                   {getMoodIcon(statistics.most_common_mood)}
//                   <span className="font-medium">Tâm trạng phổ biến nhất: {statistics.most_common_mood}</span>
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Xu hướng: {getTrendLabel(statistics.mood_trend)}
//                 </div>
//               </div>
//             </div>

//             {/* Energy Distribution */}
//             <div className="space-y-4">
//               <h3 className="font-semibold text-gray-800">Phân Bố Năng Lượng</h3>
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="text-center p-3 bg-yellow-50 rounded-lg">
//                   <div className="flex items-center justify-center gap-2 mb-1">
//                     <FaBolt className="text-yellow-500" />
//                     <span className="font-medium">Cao</span>
//                   </div>
//                   <div className="text-2xl font-bold text-yellow-600">
//                     {statistics.energy_distribution.high}
//                   </div>
//                 </div>
//                 <div className="text-center p-3 bg-orange-50 rounded-lg">
//                   <div className="flex items-center justify-center gap-2 mb-1">
//                     <FaThermometerHalf className="text-orange-500" />
//                     <span className="font-medium">TB</span>
//                   </div>
//                   <div className="text-2xl font-bold text-orange-600">
//                     {statistics.energy_distribution.medium}
//                   </div>
//                 </div>
//                 <div className="text-center p-3 bg-red-50 rounded-lg">
//                   <div className="flex items-center justify-center gap-2 mb-1">
//                     <FaHeart className="text-red-500" />
//                     <span className="font-medium">Thấp</span>
//                   </div>
//                   <div className="text-2xl font-bold text-red-600">
//                     {statistics.energy_distribution.low}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Symptoms */}
//             {statistics.most_common_symptoms.length > 0 && (
//               <div className="space-y-4">
//                 <h3 className="font-semibold text-gray-800">Triệu Chứng Phổ Biến</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {statistics.most_common_symptoms.map((symptom, index) => (
//                     <Badge key={index} variant="secondary">
//                       {symptom}
//                     </Badge>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Notes */}
//             {statistics.common_notes.length > 0 && (
//               <div className="space-y-4">
//                 <h3 className="font-semibold text-gray-800">Ghi Chú Thường Gặp</h3>
//                 <div className="space-y-2">
//                   {statistics.common_notes.map((note, index) => (
//                     <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
//                       {note}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'comparison' && comparison && (
//           <div className="space-y-6">
//             {/* Current Cycle */}
//             <div className="space-y-4">
//               <h3 className="font-semibold text-gray-800">Chu Kỳ Hiện Tại</h3>
//               <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg">
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-pink-600">
//                       {comparison.current_cycle.period_mood_stats.total_period_days}
//                     </div>
//                     <div className="text-xs text-gray-600">Ngày kinh</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-blue-600">
//                       {comparison.current_cycle.period_mood_stats.days_with_mood_data}
//                     </div>
//                     <div className="text-xs text-gray-600">Có ghi chú</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-green-600">
//                       {getMoodIcon(comparison.current_cycle.period_mood_stats.average_mood)}
//                     </div>
//                     <div className="text-xs text-gray-600">Tâm trạng TB</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-yellow-600">
//                       {getTrendIcon(comparison.current_cycle.period_mood_stats.mood_trend)}
//                     </div>
//                     <div className="text-xs text-gray-600">Xu hướng</div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Trends */}
//             <div className="space-y-4">
//               <h3 className="font-semibold text-gray-800">Xu Hướng So Sánh</h3>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <span className="font-medium">Tổng thể:</span>
//                   <div className="flex items-center gap-2">
//                     {getTrendIcon(comparison.trends.overall_trend)}
//                     <span>{getTrendLabel(comparison.trends.overall_trend)}</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <span className="font-medium">Năng lượng:</span>
//                   <div className="flex items-center gap-2">
//                     {getTrendIcon(comparison.trends.energy_trend)}
//                     <span>{getTrendLabel(comparison.trends.energy_trend)}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Symptom Changes */}
//             {comparison.trends.symptom_changes.length > 0 && (
//               <div className="space-y-4">
//                 <h3 className="font-semibold text-gray-800">Thay Đổi Triệu Chứng</h3>
//                 <div className="space-y-2">
//                   {comparison.trends.symptom_changes.map((change, index) => (
//                     <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                       <span className="font-medium">{change.symptom}:</span>
//                       <div className="flex items-center gap-2">
//                         {change.change === 'increased' && <FaArrowUp className="text-red-500" />}
//                         {change.change === 'decreased' && <FaArrowDown className="text-green-500" />}
//                         {change.change === 'stable' && <FaMinus className="text-gray-500" />}
//                         <span className="text-sm">
//                           {change.change === 'increased' && 'Tăng'}
//                           {change.change === 'decreased' && 'Giảm'}
//                           {change.change === 'stable' && 'Ổn định'}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Previous Cycles */}
//             {comparison.previous_cycles.length > 0 && (
//               <div className="space-y-4">
//                 <h3 className="font-semibold text-gray-800">Chu Kỳ Trước</h3>
//                 <div className="space-y-3">
//                   {comparison.previous_cycles.map((cycle, index) => (
//                     <div key={index} className="p-4 bg-gray-50 rounded-lg">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="font-medium">
//                           Chu kỳ {new Date(cycle.cycle_start_date).toLocaleDateString('vi-VN')}
//                         </span>
//                         <Badge variant="outline">
//                           {cycle.period_mood_stats.total_period_days} ngày
//                         </Badge>
//                       </div>
//                       <div className="grid grid-cols-3 gap-4 text-sm">
//                         <div className="text-center">
//                           <div className="font-medium">{cycle.period_mood_stats.days_with_mood_data}</div>
//                           <div className="text-gray-600">Có ghi chú</div>
//                         </div>
//                         <div className="text-center">
//                           <div className="font-medium">{getMoodIcon(cycle.period_mood_stats.average_mood)}</div>
//                           <div className="text-gray-600">Tâm trạng TB</div>
//                         </div>
//                         <div className="text-center">
//                           <div className="font-medium">{getTrendIcon(cycle.period_mood_stats.mood_trend)}</div>
//                           <div className="text-gray-600">Xu hướng</div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {!statistics && activeTab === 'current' && (
//           <div className="text-center py-8 text-gray-500">
//             <FaChartLine className="text-4xl mx-auto mb-4 text-gray-300" />
//             <p>Chưa có dữ liệu thống kê</p>
//           </div>
//         )}

//         {!comparison && activeTab === 'comparison' && (
//           <div className="text-center py-8 text-gray-500">
//             <FaTrendingUp className="text-4xl mx-auto mb-4 text-gray-300" />
//             <p>Chưa có dữ liệu so sánh</p>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default CycleMoodStatistics; 
 