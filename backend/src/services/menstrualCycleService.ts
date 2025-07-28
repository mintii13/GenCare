// service/menstrualCycle.service.ts
import mongoose from 'mongoose';
import { IMenstrualCycle, IMoodData, IDailyMoodData, IPeriodDay } from '../models/MenstrualCycle';
import { MenstrualCycleRepository } from '../repositories/menstrualCycleRepository';
import { 
    CycleData, 
    TodayStatus, 
    CycleStatistics, 
    PeriodStatistics, 
    PeriodMoodStatistics,
    MoodDataResponse, 
    MoodDataListResponse, 
    MonthlyMoodSummaryResponse 
} from '../dto/responses/menstrualCycleResponse';
import { ProcessCycleWithMoodRequest, PeriodDayMoodRequest } from '../dto/requests/menstrualCycleRequest';

// Define types for backward compatibility
type RegularityStatus = 'regular' | 'irregular' | 'insufficient_data';
type TrendStatus = 'stable' | 'lengthening' | 'shortening';

export class MenstrualCycleService {
    // New method for processing cycle with period day mood data
    public static async processCycleWithMoodData(user_id: string, request: ProcessCycleWithMoodRequest) {
        try {
            console.log('[MenstrualCycleService] processCycleWithMoodData called with:', {
                user_id,
                requestType: typeof request,
                periodDaysCount: request.period_days?.length,
                periodDays: request.period_days
            });

            if (!request.period_days || request.period_days.length === 0) {
                throw new Error('No period days provided');
            }

            // Debug: Log each period day
            request.period_days.forEach((pd, index) => {
                console.log(`[MenstrualCycleService] Period day ${index}:`, {
                    date: pd.date,
                    dateType: typeof pd.date,
                    moodData: pd.mood_data,
                    moodDataType: typeof pd.mood_data
                });
            });

            // Convert string dates to Date objects and add default mood data
            const sortedPeriodDays: IPeriodDay[] = request.period_days.map(pd => {
                console.log('[MenstrualCycleService] Processing period day:', pd);
                
                // Handle case where pd.date might be an object
                let dateString: string;
                if (typeof pd.date === 'string') {
                    dateString = pd.date;
                } else if (typeof pd.date === 'object' && pd.date !== null && 'date' in pd.date) {
                    // If date is an object with a 'date' property, extract it
                    dateString = (pd.date as any).date;
                    console.log('[MenstrualCycleService] Extracted date from object:', dateString);
                } else {
                    console.error('[MenstrualCycleService] Invalid date format:', pd.date, 'Type:', typeof pd.date);
                    throw new Error(`Invalid date format: ${JSON.stringify(pd.date)}`);
                }
                
                const date = new Date(dateString);
                
                // Validate date
                if (isNaN(date.getTime())) {
                    console.error('[MenstrualCycleService] Invalid date:', dateString, 'Type:', typeof dateString);
                    throw new Error(`Invalid date: ${dateString}`);
                }
                
                return {
                    date: date,
                    mood_data: pd.mood_data || {
                        mood: 'neutral',
                        energy: 'medium',
                        symptoms: [],
                        notes: ''
                    }
                };
            });

            // Sort by date to ensure chronological order
            sortedPeriodDays.sort((a, b) => a.date.getTime() - b.date.getTime());

            console.log('[MenstrualCycleService] Converted and sorted period days:', {
                count: sortedPeriodDays.length,
                dates: sortedPeriodDays.map(pd => {
                    try {
                        return pd.date.toISOString().split('T')[0];
                    } catch (error) {
                        console.error('[MenstrualCycleService] Error formatting date:', pd.date, error);
                        return 'Invalid Date';
                    }
                })
            });

            // Group consecutive days into cycles
            const groupedCycles = this.groupConsecutivePeriodDays(sortedPeriodDays);
            console.log('[MenstrualCycleService] Grouped cycles:', {
                totalGroups: groupedCycles.length,
                groups: groupedCycles.map((group, index) => ({
                    groupIndex: index,
                    daysCount: group.length,
                    dates: group.map(pd => pd.date.toISOString().split('T')[0])
                }))
            });

            if (groupedCycles.length === 0) {
                console.log('[MenstrualCycleService] No valid cycles found after grouping');
                return { success: false, message: 'Không tìm thấy chu kỳ hợp lệ' };
            }

            // Process each cycle group
            const savedCycles: CycleData[] = [];
            for (const cycleGroup of groupedCycles) {
                console.log('[MenstrualCycleService] Processing cycle group:', {
                    daysCount: cycleGroup.length,
                    dates: cycleGroup.map(pd => pd.date.toISOString().split('T')[0])
                });

                const cycleStartDate = cycleGroup[0].date;
                const cycleLength = await this.calculatePersonalizedCycleLength(user_id, cycleStartDate);
                
                console.log('[MenstrualCycleService] Cycle details:', {
                    startDate: cycleStartDate.toISOString().split('T')[0],
                    cycleLength: cycleLength
                });

                // Calculate predictions
                const ovulationDate = this.predictOvulationDate(cycleStartDate, cycleLength);
                const fertileStart = this.predictFertileStart(cycleStartDate, cycleLength);
                const fertileEnd = this.predictFertileEnd(cycleStartDate, cycleLength);
                const predictedCycleEnd = new Date(cycleStartDate);
                predictedCycleEnd.setDate(predictedCycleEnd.getDate() + cycleLength);

                console.log('[MenstrualCycleService] Predictions:', {
                    ovulationDate: ovulationDate.toISOString().split('T')[0],
                    fertileStart: fertileStart.toISOString().split('T')[0],
                    fertileEnd: fertileEnd.toISOString().split('T')[0],
                    predictedCycleEnd: predictedCycleEnd.toISOString().split('T')[0]
                });

                // Create cycle data
                const cycleData = {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    cycle_start_date: cycleStartDate,
                    period_days: cycleGroup,
                    cycle_length: cycleLength,
                    predicted_cycle_end: predictedCycleEnd,
                    predicted_ovulation_date: ovulationDate,
                    predicted_fertile_start: fertileStart,
                    predicted_fertile_end: fertileEnd
                };

                console.log('[MenstrualCycleService] Saving cycle data:', cycleData);

                // Save to database
                const savedCycle = await MenstrualCycleRepository.create(cycleData);
                console.log('[MenstrualCycleService] Cycle saved successfully:', {
                    cycleId: savedCycle._id,
                    startDate: savedCycle.cycle_start_date
                });

                // Convert to CycleData format for response
                const cycleDataResponse: CycleData = {
                    _id: savedCycle._id.toString(),
                    user_id: savedCycle.user_id.toString(),
                    cycle_start_date: savedCycle.cycle_start_date.toISOString(),
                    period_days: savedCycle.period_days,
                    cycle_length: savedCycle.cycle_length,
                    predicted_cycle_end: savedCycle.predicted_cycle_end.toISOString(),
                    predicted_ovulation_date: savedCycle.predicted_ovulation_date.toISOString(),
                    predicted_fertile_start: savedCycle.predicted_fertile_start.toISOString(),
                    predicted_fertile_end: savedCycle.predicted_fertile_end.toISOString(),
                    createdAt: savedCycle.createdAt.toISOString(),
                    updatedAt: savedCycle.updatedAt.toISOString()
                };

                savedCycles.push(cycleDataResponse);
            }

            console.log('[MenstrualCycleService] All cycles saved successfully:', {
                totalSaved: savedCycles.length,
                cycleIds: savedCycles.map(c => c._id)
            });

            return {
                success: true,
                message: `Đã lưu ${savedCycles.length} chu kỳ thành công`,
                data: savedCycles
            };

        } catch (error) {
            console.error('[MenstrualCycleService] Error processing cycle with mood data:', error);
            return {
                success: false,
                message: 'Lỗi hệ thống khi xử lý chu kỳ'
            };
        }
    }

    // Helper method to group period days into cycles
    private static groupConsecutivePeriodDays(periodDays: IPeriodDay[]): IPeriodDay[][] {
        console.log('[MenstrualCycleService] groupConsecutivePeriodDays input:', {
            totalDays: periodDays.length,
            dates: periodDays.map(pd => {
                try {
                    return pd.date.toISOString().split('T')[0];
                } catch (error) {
                    console.error('[MenstrualCycleService] Error formatting date in input:', pd.date, error);
                    return 'Invalid Date';
                }
            })
        });
        
        // Handle special case: only one day
        if (periodDays.length === 1) {
            console.log('[MenstrualCycleService] Single day input, creating single-day period');
            return [periodDays];
        }
        
        const groups: IPeriodDay[][] = [];
        let current: IPeriodDay[] = [periodDays[0]];

        for (let i = 1; i < periodDays.length; i++) {
            const currentDate = new Date(periodDays[i].date);
            const prevDate = new Date(periodDays[i - 1].date);
            
            const diffMs = currentDate.getTime() - prevDate.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            
            try {
                console.log(`[MenstrualCycleService] Day ${i}: ${currentDate.toISOString().split('T')[0]} - ${prevDate.toISOString().split('T')[0]} = ${diffDays} days`);
            } catch (error) {
                console.error('[MenstrualCycleService] Error formatting date in loop:', error);
            }
            
            if (diffDays === 1) {
                // Ngày liên tiếp - cùng kỳ kinh
                current.push(periodDays[i]);
                console.log(`[MenstrualCycleService] Consecutive day, current group size: ${current.length}`);
            } else if (diffDays >= 21) {
                // Khoảng cách >= 21 ngày - kỳ kinh mới
                // Validate kỳ kinh hiện tại
                if (current.length >= 1 && current.length <= 7) {
                    groups.push(current);
                    console.log(`[MenstrualCycleService] Valid period found: ${current.length} days`);
                } else {
                    console.warn(`[MenstrualCycleService] Bỏ qua kỳ kinh có ${current.length} ngày (không hợp lý)`);
                }
                current = [periodDays[i]];
            } else {
                // Khoảng cách 2-20 ngày - có thể là lỗi hoặc kỳ kinh không đều
                console.warn(`[MenstrualCycleService] Khoảng cách ${diffDays} ngày giữa các kỳ kinh không hợp lý`);
                // Ghép vào kỳ hiện tại nếu khoảng cách nhỏ
                if (diffDays <= 3) {
                    current.push(periodDays[i]);
                    console.log(`[MenstrualCycleService] Small gap, added to current group. Size: ${current.length}`);
                } else {
                    // Tạo kỳ mới nếu khoảng cách lớn
                    if (current.length >= 1 && current.length <= 7) {
                        groups.push(current);
                        console.log(`[MenstrualCycleService] Valid period found after gap: ${current.length} days`);
                    }
                    current = [periodDays[i]];
                }
            }
        }
        
        // Validate kỳ kinh cuối
        if (current.length >= 1 && current.length <= 7) {
            groups.push(current);
            console.log(`[MenstrualCycleService] Final valid period: ${current.length} days`);
        } else if (current.length > 0) {
            console.warn(`[MenstrualCycleService] Bỏ qua kỳ kinh cuối có ${current.length} ngày (không hợp lý)`);
        }
        
        console.log(`[MenstrualCycleService] Total valid periods found: ${groups.length}`);
        return groups;
    }

    // Helper methods for predictions
    private static calculateCycleLength(periodDays: IPeriodDay[]): number {
        // Calculate the actual cycle length based on the period days
        if (periodDays.length === 0) return 28; // Default cycle length
        
        // Sort period days by date
        const sortedDays = periodDays.sort((a, b) => a.date.getTime() - b.date.getTime());
        const firstDay = sortedDays[0].date;
        const lastDay = sortedDays[sortedDays.length - 1].date;
        
        // Calculate period length (not cycle length)
        const periodLength = Math.floor((lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        console.log(`[MenstrualCycleService] Period length: ${periodLength} days`);
        
        // Return default cycle length - actual cycle length will be calculated from historical data
        return 28;
    }

    // New method to calculate personalized cycle length from user's historical data
    private static async calculatePersonalizedCycleLength(user_id: string, currentPeriodStart: Date): Promise<number> {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (!cycles || cycles.length === 0) {
                return 28; // Default for first cycle
            }
            
            // Sort cycles by start date
            const sortedCycles = cycles.sort((a, b) => 
                new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()
            );
            
            // Calculate cycle lengths between consecutive cycles
            const cycleLengths: number[] = [];
            
            for (let i = 1; i < sortedCycles.length; i++) {
                const currentStart = new Date(sortedCycles[i].cycle_start_date);
                const previousStart = new Date(sortedCycles[i-1].cycle_start_date);
                
                const daysBetween = Math.floor((currentStart.getTime() - previousStart.getTime()) / (1000 * 60 * 60 * 24));
                
                // Only count if it's a reasonable cycle length (21-35 days)
                if (daysBetween >= 21 && daysBetween <= 35) {
                    cycleLengths.push(daysBetween);
                }
            }
            
            // Calculate with current cycle
            if (sortedCycles.length > 0) {
                const lastCycleStart = new Date(sortedCycles[sortedCycles.length - 1].cycle_start_date);
                const daysBetween = Math.floor((currentPeriodStart.getTime() - lastCycleStart.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysBetween >= 21 && daysBetween <= 35) {
                    cycleLengths.push(daysBetween);
                }
            }
            
            if (cycleLengths.length === 0) {
                return 28; // Default if no valid cycles found
            }
            
            // Calculate weighted average (recent cycles have higher weight)
            let weightedSum = 0;
            let totalWeight = 0;
            
            for (let i = 0; i < cycleLengths.length; i++) {
                const weight = Math.pow(1.2, i); // Recent cycles have higher weight
                weightedSum += cycleLengths[i] * weight;
                totalWeight += weight;
            }
            
            const personalizedCycleLength = Math.round(weightedSum / totalWeight);
            
            console.log(`[MenstrualCycleService] Personalized cycle length: ${personalizedCycleLength} days (from ${cycleLengths.length} cycles)`);
            
            // Ensure within reasonable range
            return Math.max(21, Math.min(35, personalizedCycleLength));
            
        } catch (error) {
            console.error('[MenstrualCycleService] Error calculating personalized cycle length:', error);
            return 28; // Default on error
        }
    }

    private static predictCycleEnd(startDate: Date, cycleLength: number = 28): Date {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + cycleLength);
        return endDate;
    }

    private static predictOvulationDate(startDate: Date, cycleLength: number = 28): Date {
        const ovulationDate = new Date(startDate);
        // Business Rule: Ovulation typically occurs 14 days before the next period
        // So ovulation = cycle_start + (cycle_length - 14)
        const ovulationDay = cycleLength - 14;
        ovulationDate.setDate(ovulationDate.getDate() + ovulationDay);
        
        console.log('[Ovulation Prediction]', {
            cycleStart: startDate.toISOString().split('T')[0],
            cycleLength,
            ovulationDay,
            ovulationDate: ovulationDate.toISOString().split('T')[0]
        });
        
        return ovulationDate;
    }

    private static predictFertileStart(startDate: Date, cycleLength: number = 28): Date {
        const fertileStart = new Date(startDate);
        // Business Rule: Fertile window = [ovulation - 5 days; ovulation + 1 day]
        // Total fertile window = 7 days
        const ovulationDay = cycleLength - 14;
        const fertileWindowStart = ovulationDay - 5; // 5 days before ovulation
        fertileStart.setDate(fertileStart.getDate() + fertileWindowStart);
        
        console.log('[Fertile Window Start]', {
            cycleStart: startDate.toISOString().split('T')[0],
            ovulationDay,
            fertileWindowStart,
            fertileStart: fertileStart.toISOString().split('T')[0]
        });
        
        return fertileStart;
    }

    private static predictFertileEnd(startDate: Date, cycleLength: number = 28): Date {
        const fertileEnd = new Date(startDate);
        // Business Rule: Fertile window = [ovulation - 5 days; ovulation + 1 day]
        // Total fertile window = 7 days
        const ovulationDay = cycleLength - 14;
        const fertileWindowEnd = ovulationDay + 1; // 1 day after ovulation
        fertileEnd.setDate(fertileEnd.getDate() + fertileWindowEnd);
        
        console.log('[Fertile Window End]', {
            cycleStart: startDate.toISOString().split('T')[0],
            ovulationDay,
            fertileWindowEnd,
            fertileEnd: fertileEnd.toISOString().split('T')[0]
        });
        
        return fertileEnd;
    }

    // Create period day with mood data
    public static async createPeriodDayWithMood(user_id: string, date: string, mood_data: IDailyMoodData): Promise<MoodDataResponse> {
        try {
            const result = await MenstrualCycleRepository.createPeriodDayWithMood(user_id, date, mood_data);
            
            if (result) {
                return {
                    success: true,
                    message: 'Period day created with mood data successfully',
                    data: {
                        date,
                        mood_data
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to create period day with mood data'
                };
            }
        } catch (error) {
            console.error('Error creating period day with mood:', error);
            return {
                success: false,
                message: 'Failed to create period day with mood data'
            };
        }
    }

    // Update period day mood data
    public static async updatePeriodDayMood(user_id: string, date: string, mood_data: IDailyMoodData): Promise<MoodDataResponse> {
        try {
            const result = await MenstrualCycleRepository.updatePeriodDayMood(user_id, date, mood_data);
            
            if (result) {
                return {
                    success: true,
                    message: 'Mood data updated successfully',
                    data: {
                        date,
                        mood_data
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'Period day not found or mood data not updated'
                };
            }
        } catch (error) {
            console.error('Error updating period day mood:', error);
            return {
                success: false,
                message: 'Failed to update mood data'
            };
        }
    }

    // Get period day mood data
    public static async getPeriodDayMood(user_id: string, date: string): Promise<MoodDataResponse> {
        try {
            const moodData = await MenstrualCycleRepository.getPeriodDayMood(user_id, date);
            
            if (moodData) {
                return {
                    success: true,
                    message: 'Mood data retrieved successfully',
                    data: {
                        date,
                        mood_data: moodData
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'No mood data found for this date'
                };
            }
        } catch (error) {
            console.error('Error getting period day mood:', error);
            return {
                success: false,
                message: 'Failed to retrieve mood data'
            };
        }
    }

    // Get cycle mood statistics
    public static async getCycleMoodStatistics(user_id: string, cycle_id?: string): Promise<any> {
        try {
            const cycles = cycle_id 
                ? await MenstrualCycleRepository.findById(cycle_id)
                : await MenstrualCycleRepository.findByUser(user_id);

            if (!cycles || (Array.isArray(cycles) && cycles.length === 0)) {
                return {
                    success: false,
                    message: 'No cycles found'
                };
            }

            const cycle = Array.isArray(cycles) ? cycles[0] : cycles;
            const periodDays = cycle.period_days || [];
            
            const daysWithMood = periodDays.filter(day => day.mood_data);
            const moodCounts: { [key: string]: number } = {};
            const energyCounts: { high: number; medium: number; low: number } = { high: 0, medium: 0, low: 0 };
            const allSymptoms: string[] = [];
            const allNotes: string[] = [];

            daysWithMood.forEach(day => {
                if (day.mood_data) {
                    // Count moods
                    moodCounts[day.mood_data.mood] = (moodCounts[day.mood_data.mood] || 0) + 1;
                    
                    // Count energy levels
                    energyCounts[day.mood_data.energy]++;
                    
                    // Collect symptoms
                    if (day.mood_data.symptoms) {
                        allSymptoms.push(...day.mood_data.symptoms);
                    }
                    
                    // Collect notes
                    if (day.mood_data.notes) {
                        allNotes.push(day.mood_data.notes);
                    }
                }
            });

            // Calculate most common values
            const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
                moodCounts[a] > moodCounts[b] ? a : b, 'neutral');
            
            const mostCommonSymptoms = this.getMostCommonItems(allSymptoms, 5);
            const commonNotes = this.getMostCommonItems(allNotes, 3);

            // Calculate average mood (simplified)
            const averageMood = mostCommonMood;

            // Determine mood trend (simplified - can be enhanced)
            const moodTrend = this.calculateMoodTrend(periodDays);

            const statistics: PeriodMoodStatistics = {
                total_period_days: periodDays.length,
                days_with_mood_data: daysWithMood.length,
                average_mood: averageMood,
                most_common_mood: mostCommonMood,
                most_common_symptoms: mostCommonSymptoms,
                mood_trend: moodTrend,
                energy_distribution: energyCounts,
                common_notes: commonNotes
            };

            return { 
                success: true, 
                message: 'Cycle mood statistics retrieved successfully',
                data: statistics
            };

        } catch (error) {
            console.error('Error getting cycle mood statistics:', error);
            return {
                success: false,
                message: 'Failed to retrieve cycle mood statistics'
            };
        }
    }

    // Get cycle comparison
    public static async getCycleComparison(user_id: string) {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (!cycles || cycles.length < 2) {
                return {
                    success: false,
                    message: 'Cần ít nhất 2 chu kỳ để so sánh'
                };
            }

            // Sort cycles by start date
            const sortedCycles = cycles.sort((a, b) => 
                new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()
            );

            const comparisons = [];
            
            // Compare consecutive cycles
            for (let i = 1; i < sortedCycles.length; i++) {
                const currentCycle = sortedCycles[i];
                const previousCycle = sortedCycles[i-1];
                
                const currentStart = new Date(currentCycle.cycle_start_date);
                const previousStart = new Date(previousCycle.cycle_start_date);
                
                const daysBetween = Math.floor((currentStart.getTime() - previousStart.getTime()) / (1000 * 60 * 60 * 24));
                
                comparisons.push({
                    cycle_number: i + 1,
                    start_date: currentCycle.cycle_start_date,
                    cycle_length: daysBetween,
                    period_length: currentCycle.period_days.length,
                    mood_comparison: this.compareMoodData(currentCycle.period_days, previousCycle.period_days)
                });
            }

            return {
                success: true,
                message: 'Cycle comparison retrieved successfully',
                data: {
                    total_cycles: cycles.length,
                    comparisons: comparisons
                }
            };
        } catch (error) {
            console.error('Error getting cycle comparison:', error);
            return {
                success: false,
                message: 'Failed to retrieve cycle comparison'
            };
        }
    }

    public static async getCycleStatistics(user_id: string) {
        try {
            console.log('[getCycleStatistics] Starting with user_id:', user_id);
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            console.log('[getCycleStatistics] Found cycles:', cycles?.length || 0);
            
            if (!cycles || cycles.length === 0) {
                console.log('[getCycleStatistics] No cycles found');
                return {
                    success: false,
                    message: 'Chưa có dữ liệu chu kỳ'
                };
            }

            // Sort cycles by start date
            const sortedCycles = cycles.sort((a, b) => 
                new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()
            );

            // Calculate cycle lengths from actual cycle_length in database
            const cycleLengths = sortedCycles.map(cycle => cycle.cycle_length || 28);
            
            // Calculate average from actual cycle lengths
            let averageCycleLength = 28;
            if (cycleLengths.length > 0) {
                averageCycleLength = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
            }

            const shortestCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : 28;
            const longestCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : 28;

            // Determine regularity
            let cycleRegularity = 'insufficient_data';
            if (cycleLengths.length >= 3) {
                const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - averageCycleLength, 2), 0) / cycleLengths.length;
                const standardDeviation = Math.sqrt(variance);
                cycleRegularity = standardDeviation <= 3 ? 'regular' : 'irregular';
            } else if (sortedCycles.length === 1) {
                // For single cycle, show as regular if cycle length is within normal range
                cycleRegularity = (averageCycleLength >= 21 && averageCycleLength <= 35) ? 'regular' : 'irregular';
            }

            // Determine trend
            let trend = 'stable';
            if (cycleLengths.length >= 3) {
                const recentCycles = cycleLengths.slice(-3);
                const firstHalf = recentCycles.slice(0, Math.ceil(recentCycles.length / 2));
                const secondHalf = recentCycles.slice(Math.ceil(recentCycles.length / 2));
                
                const firstAvg = firstHalf.reduce((sum, length) => sum + length, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((sum, length) => sum + length, 0) / secondHalf.length;
                
                if (secondAvg > firstAvg + 2) {
                    trend = 'lengthening';
                } else if (secondAvg < firstAvg - 2) {
                    trend = 'shortening';
                }
            }

            // Calculate tracking period
            const firstCycleDate = new Date(sortedCycles[0].cycle_start_date);
            const lastCycleDate = new Date(sortedCycles[sortedCycles.length - 1].cycle_start_date);
            const trackingPeriodMonths = Math.ceil(
                (lastCycleDate.getTime() - firstCycleDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
            );

            // Get last 6 cycles with actual cycle_length from database
            const last6Cycles = sortedCycles.slice(-6).map((cycle) => {
                const cycleLength = cycle.cycle_length || 28;
                
                return {
                    start_date: cycle.cycle_start_date,
                    length: cycleLength >= 21 && cycleLength <= 35 ? cycleLength : 28
                };
            });

            console.log('[getCycleStatistics] Calculated stats:', {
                total_cycles: sortedCycles.length,
                cycle_lengths: cycleLengths,
                average_cycle_length: averageCycleLength,
                shortest_cycle: shortestCycle,
                longest_cycle: longestCycle,
                cycle_regularity: cycleRegularity,
                trend: trend,
                tracking_period_months: trackingPeriodMonths,
                total_cycles_tracked: sortedCycles.length,
                last_6_cycles_count: last6Cycles.length
            });
            
            return {
                success: true,
                message: 'Cycle statistics retrieved successfully',
                data: {
                    average_cycle_length: averageCycleLength,
                    shortest_cycle: shortestCycle,
                    longest_cycle: longestCycle,
                    cycle_regularity: cycleRegularity,
                    trend: trend,
                    tracking_period_months: trackingPeriodMonths,
                    total_cycles_tracked: sortedCycles.length,
                    last_6_cycles: last6Cycles
                }
            };
        } catch (error) {
            console.error('[getCycleStatistics] Error:', error);
            return {
                success: false,
                message: 'Failed to retrieve cycle statistics'
            };
        }
    }

    public static async getPeriodStatistics(user_id: string) {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (!cycles || cycles.length === 0) {
                return {
                    success: false,
                    message: 'Chưa có dữ liệu chu kỳ'
                };
            }

            // Calculate period lengths
            const periodLengths = cycles.map(cycle => cycle.period_days.length).filter(length => length > 0);
            
            if (periodLengths.length === 0) {
                return {
                    success: false,
                    message: 'Chưa có dữ liệu kinh nguyệt'
                };
            }

            const averagePeriodLength = Math.round(periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length);
            const shortestPeriod = Math.min(...periodLengths);
            const longestPeriod = Math.max(...periodLengths);

            // Determine regularity
            let periodRegularity = 'insufficient_data';
            if (periodLengths.length >= 3) {
                const variance = periodLengths.reduce((sum, length) => sum + Math.pow(length - averagePeriodLength, 2), 0) / periodLengths.length;
                const standardDeviation = Math.sqrt(variance);
                periodRegularity = standardDeviation <= 1 ? 'regular' : 'irregular';
            }

            // Get last 3 periods
            const last3Periods = cycles.slice(-3).map(cycle => ({
                start_date: cycle.cycle_start_date,
                length: cycle.period_days.length
            }));

            return {
                success: true,
                message: 'Period statistics retrieved successfully',
                data: {
                    average_period_length: averagePeriodLength,
                    shortest_period: shortestPeriod,
                    longest_period: longestPeriod,
                    period_regularity: periodRegularity,
                    total_periods_tracked: cycles.length,
                    last_3_periods: last3Periods
                }
            };
        } catch (error) {
            console.error('Error getting period statistics:', error);
            return {
                success: false,
                message: 'Failed to retrieve period statistics'
            };
        }
    }

    public static async getMoodStatistics(user_id: string) {
        try {
            console.log('[Backend] Getting mood statistics for user:', user_id);
            
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            if (!cycles || cycles.length === 0) {
                return {
                    success: false,
                    message: 'No cycles found for user'
                };
            }

            // Calculate mood statistics
            const moodCounts = {
                happy: 0,
                neutral: 0,
                tired: 0,
                stressed: 0,
                other: 0
            };

            const energyCounts = {
                high: 0,
                medium: 0,
                low: 0
            };

            let totalMoodEntries = 0;

            cycles.forEach(cycle => {
                if (cycle.period_days && cycle.period_days.length > 0) {
                    cycle.period_days.forEach((periodDay: any) => {
                        if (periodDay.mood_data && periodDay.mood_data.mood) {
                            totalMoodEntries++;
                            
                            // Count moods
                            switch (periodDay.mood_data.mood) {
                                case 'happy':
                                    moodCounts.happy++;
                                    break;
                                case 'neutral':
                                    moodCounts.neutral++;
                                    break;
                                case 'tired':
                                    moodCounts.tired++;
                                    break;
                                case 'stressed':
                                    moodCounts.stressed++;
                                    break;
                                default:
                                    moodCounts.other++;
                                    break;
                            }

                            // Count energy levels
                            if (periodDay.mood_data.energy) {
                                switch (periodDay.mood_data.energy) {
                                    case 'high':
                                        energyCounts.high++;
                                        break;
                                    case 'medium':
                                        energyCounts.medium++;
                                        break;
                                    case 'low':
                                        energyCounts.low++;
                                        break;
                                }
                            }
                        }
                    });
                }
            });

            return {
                success: true,
                data: {
                    total_mood_entries: totalMoodEntries,
                    mood_distribution: {
                        happy: moodCounts.happy,
                        neutral: moodCounts.neutral,
                        tired: moodCounts.tired,
                        stressed: moodCounts.stressed,
                        other: moodCounts.other
                    },
                    energy_distribution: {
                        high: energyCounts.high,
                        medium: energyCounts.medium,
                        low: energyCounts.low
                    },
                    most_common_mood: Object.keys(moodCounts).reduce((a, b) => 
                        moodCounts[a as keyof typeof moodCounts] > moodCounts[b as keyof typeof moodCounts] ? a : b
                    ),
                    most_common_energy: Object.keys(energyCounts).reduce((a, b) => 
                        energyCounts[a as keyof typeof energyCounts] > energyCounts[b as keyof typeof energyCounts] ? a : b
                    )
                }
            };
        } catch (error) {
            console.error('[Backend] Error getting mood statistics:', error);
            return {
                success: false,
                message: 'Failed to retrieve mood statistics'
            };
        }
    }

    // Helper methods
    private static getMostCommonItems(items: string[], limit: number): string[] {
        const counts: { [key: string]: number } = {};
        items.forEach(item => {
            counts[item] = (counts[item] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([item]) => item);
    }

    private static calculateMoodTrend(periodDays: IPeriodDay[]): 'improving' | 'declining' | 'stable' {
        const daysWithMood = periodDays.filter(day => day.mood_data).sort((a, b) => 
            a.date.getTime() - b.date.getTime()
        );

        if (daysWithMood.length < 2) {
            return 'stable';
        }

        // Simple trend calculation based on mood progression
        const moodScores: { [key: string]: number } = {
            'happy': 5, 'excited': 4, 'calm': 3, 'neutral': 2, 'tired': 1, 'sad': 0, 'stressed': 0
        };

        const scores = daysWithMood.map(day => moodScores[day.mood_data!.mood] || 2);
        const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
        const secondHalf = scores.slice(Math.ceil(scores.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (secondAvg > firstAvg + 0.5) return 'improving';
        if (secondAvg < firstAvg - 0.5) return 'declining';
        return 'stable';
    }

    private static calculateComparisonTrends(currentStats: PeriodMoodStatistics, previousStats: any[]): any {
        if (previousStats.length === 0) {
            return {
                overall_trend: 'stable',
                symptom_changes: [],
                energy_trend: 'stable'
            };
        }

        // Calculate average of previous cycles
        const avgPreviousMood = previousStats.reduce((sum, stat) => {
            const moodScores: { [key: string]: number } = {
                'happy': 5, 'excited': 4, 'calm': 3, 'neutral': 2, 'tired': 1, 'sad': 0, 'stressed': 0
            };
            return sum + (moodScores[stat.average_mood] || 2);
        }, 0) / previousStats.length;

        const currentMoodScore = {
            'happy': 5, 'excited': 4, 'calm': 3, 'neutral': 2, 'tired': 1, 'sad': 0, 'stressed': 0
        }[currentStats.average_mood] || 2;

        const overallTrend = currentMoodScore > avgPreviousMood + 0.5 ? 'improving' 
            : currentMoodScore < avgPreviousMood - 0.5 ? 'declining' : 'stable';

        return {
            overall_trend: overallTrend,
            symptom_changes: [], // Can be enhanced with detailed symptom comparison
            energy_trend: 'stable' // Can be enhanced with energy level comparison
        };
    }

    // Keep existing methods for backward compatibility - simplified version
    public static async processPeriodDays(user_id: string, period_days: Date[], mood_data: IMoodData = {}) {
        // Convert old format to new format
        const periodDayRequests: PeriodDayMoodRequest[] = period_days.map(date => ({
            date: date.toISOString().split('T')[0],
            mood_data: {
                mood: 'neutral',
                energy: 'medium',
                symptoms: [],
                notes: ''
            }
        }));

        const request: ProcessCycleWithMoodRequest = {
            period_days: periodDayRequests
        };

        return this.processCycleWithMoodData(user_id, request);
    }

    // Add other existing methods as needed for backward compatibility
    public static async getCycles(user_id: string) {
        try {
            console.log('[Backend] getCycles called with user_id:', user_id);
            
            // Clean up duplicates first
            await MenstrualCycleRepository.cleanupDuplicateCycles(user_id);
            
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            console.log('[Backend] getCycles result:', {
                cyclesFound: cycles?.length || 0,
                cycles: cycles?.map(c => ({
                    _id: c._id,
                    cycle_start_date: c.cycle_start_date,
                    period_days_count: c.period_days?.length || 0,
                    cycle_length: c.cycle_length
                }))
            });
            return {
                success: true,
                message: 'Cycles retrieved successfully',
                data: cycles
            };
        } catch (error) {
            console.error('Error getting cycles:', error);
            return {
                success: false,
                message: 'Failed to retrieve cycles'
            };
        }
    }

    public static async getTodayStatus(user_id: string) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (!cycles || cycles.length === 0) {
                return {
                    success: true,
                    message: 'No cycles found',
                    data: {
                        date: today.toISOString().split('T')[0],
                        is_period_day: false,
                        is_fertile_day: false,
                        is_ovulation_day: false,
                        pregnancy_chance: 'low',
                        recommendations: ['Start tracking your cycle'],
                        period_mood_data: undefined,
                        day_in_cycle: 0,
                        cycle_phase: 'Unknown'
                    }
                };
            }
            
            // Get the latest cycle
            const latestCycle = cycles[0];
            const cycleStartDate = new Date(latestCycle.cycle_start_date);
            cycleStartDate.setHours(0, 0, 0, 0);
            
            // Calculate personalized cycle length based on user's historical data
            let cycleLength = await this.calculatePersonalizedCycleLength(user_id, cycleStartDate);
            
            // If we have enough cycles, use the average from statistics for more accurate predictions
            if (cycles.length >= 2) {
                const cycleStats = await this.getCycleStatistics(user_id);
                if (cycleStats.success && cycleStats.data) {
                    cycleLength = cycleStats.data.average_cycle_length;
                    console.log('[Backend] Using average cycle length from statistics:', cycleLength);
                }
            }
            
            // Calculate day in cycle
            const daysSinceStart = Math.floor((today.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24));
            
            console.log('[Backend] getTodayStatus debug:', {
                today: today.toISOString().split('T')[0],
                cycleStartDate: cycleStartDate.toISOString().split('T')[0],
                daysSinceStart,
                originalCycleLength: latestCycle.cycle_length,
                calculatedCycleLength: cycleLength,
                predictedCycleEnd: latestCycle.predicted_cycle_end
            });
            
            let dayInCycle = 0;
            let cyclePhase = 'Unknown';
            
            if (daysSinceStart >= 0) {
                // Calculate actual day in cycle (not using modulo)
                dayInCycle = daysSinceStart + 1;
                
                // If we've exceeded the cycle length, we're in the next cycle
                if (dayInCycle > cycleLength) {
                    // Check if we have a predicted next cycle start
                    if (latestCycle.predicted_cycle_end) {
                        const predictedNextStart = new Date(latestCycle.predicted_cycle_end);
                        const daysSinceNextStart = Math.floor((today.getTime() - predictedNextStart.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysSinceNextStart >= 0) {
                            dayInCycle = daysSinceNextStart + 1;
                        } else {
                            // We're between cycles, show the last day of current cycle
                            dayInCycle = cycleLength;
                        }
                    } else {
                        // No prediction, show the last day of current cycle
                        dayInCycle = cycleLength;
                    }
                }
            } else {
                // If today is before cycle start, calculate based on predicted cycle
                if (latestCycle.predicted_cycle_end) {
                    const predictedEnd = new Date(latestCycle.predicted_cycle_end);
                    const totalCycleDays = Math.floor((predictedEnd.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    dayInCycle = totalCycleDays + daysSinceStart + 1;
                }
            }
            
            // Ensure dayInCycle is within valid range
            dayInCycle = Math.max(1, Math.min(dayInCycle, cycleLength));
            
            console.log('[Backend] Calculated dayInCycle:', dayInCycle);
            
            // Determine cycle phase based on personalized cycle length
            const ovulationDay = cycleLength - 14; // Ovulation occurs 14 days before next period
            const menstrualPhaseEnd = 5; // First 5 days are typically menstrual
            const follicularPhaseEnd = ovulationDay - 1; // Follicular phase until ovulation
            const fertileStart = ovulationDay - 5; // Fertile window starts 5 days before ovulation
            const fertileEnd = ovulationDay + 1; // Fertile window ends 1 day after ovulation
            
            console.log('[Backend] Cycle phase calculation:', {
                dayInCycle,
                cycleLength,
                ovulationDay,
                fertileStart,
                fertileEnd,
                menstrualPhaseEnd,
                follicularPhaseEnd
            });
            
            if (dayInCycle <= menstrualPhaseEnd) {
                cyclePhase = 'Menstrual';
            } else if (dayInCycle <= follicularPhaseEnd) {
                cyclePhase = 'Follicular';
            } else if (dayInCycle === ovulationDay) {
                cyclePhase = 'Ovulation';
            } else {
                cyclePhase = 'Luteal';
            }
            
            // Find if today is a period day
            const isPeriodDay = cycles.some(cycle => 
                cycle.period_days.some(day => {
                    const dayDate = new Date(day.date);
                    dayDate.setHours(0, 0, 0, 0);
                    return dayDate.getTime() === today.getTime();
                })
            );

            const periodMoodData = isPeriodDay ? 
                cycles.find(cycle => 
                    cycle.period_days.some(day => {
                        const dayDate = new Date(day.date);
                        dayDate.setHours(0, 0, 0, 0);
                        return dayDate.getTime() === today.getTime();
                    })
                )?.period_days.find(day => {
                    const dayDate = new Date(day.date);
                    dayDate.setHours(0, 0, 0, 0);
                    return dayDate.getTime() === today.getTime();
                })?.mood_data : undefined;

            // Check if today is fertile or ovulation day based on dayInCycle
            const isOvulationDay = dayInCycle === ovulationDay;
            const isFertileDay = dayInCycle >= fertileStart && dayInCycle <= fertileEnd;
            
            // Also check predicted dates as backup
            const isOvulationDayPredicted = latestCycle.predicted_ovulation_date && 
                new Date(latestCycle.predicted_ovulation_date).toDateString() === today.toDateString();
            
            const isFertileDayPredicted = latestCycle.predicted_fertile_start && latestCycle.predicted_fertile_end &&
                today >= new Date(latestCycle.predicted_fertile_start) && 
                today <= new Date(latestCycle.predicted_fertile_end);
            
            // Use dayInCycle calculation as primary, predicted dates as backup
            const finalIsOvulationDay = isOvulationDay || isOvulationDayPredicted;
            const finalIsFertileDay = isFertileDay || isFertileDayPredicted;
            
            console.log('[Backend] Fertility status:', {
                dayInCycle,
                ovulationDay,
                fertileStart,
                fertileEnd,
                isOvulationDay,
                isFertileDay,
                isOvulationDayPredicted,
                isFertileDayPredicted,
                finalIsOvulationDay,
                finalIsFertileDay
            });

            // Business Rule: Pregnancy Chance Estimation
            let pregnancyChance: 'low' | 'medium' | 'high' = 'low';
            if (finalIsOvulationDay) {
                pregnancyChance = 'high';
            } else if (finalIsFertileDay) {
                pregnancyChance = 'medium';
            }

            const todayStatus: TodayStatus = {
                date: today.toISOString().split('T')[0],
                is_period_day: isPeriodDay,
                is_fertile_day: finalIsFertileDay,
                is_ovulation_day: finalIsOvulationDay,
                pregnancy_chance: pregnancyChance,
                recommendations: this.getRecommendations(cyclePhase, isPeriodDay, finalIsFertileDay, finalIsOvulationDay),
                period_mood_data: periodMoodData,
                day_in_cycle: dayInCycle,
                cycle_phase: cyclePhase
            };

            return {
                success: true,
                message: 'Today status retrieved successfully',
                data: todayStatus
            };
        } catch (error) {
            console.error('Error getting today status:', error);
            return {
                success: false,
                message: 'Failed to retrieve today status'
            };
        }
    }

    private static getRecommendations(cyclePhase: string, isPeriodDay: boolean, isFertileDay: boolean, isOvulationDay: boolean): string[] {
        const recommendations = [];
        
        if (isPeriodDay) {
            recommendations.push('Stay hydrated', 'Get enough rest', 'Use comfortable sanitary products');
        }
        
        if (isOvulationDay) {
            recommendations.push('Monitor basal body temperature', 'Track cervical mucus changes');
        }
        
        if (isFertileDay) {
            recommendations.push('Consider fertility tracking', 'Maintain healthy lifestyle');
        }
        
        switch (cyclePhase) {
            case 'Menstrual':
                recommendations.push('Take iron supplements if needed', 'Practice gentle exercise');
                break;
            case 'Follicular':
                recommendations.push('Focus on strength training', 'Eat protein-rich foods');
                break;
            case 'Ovulation':
                recommendations.push('Monitor fertility signs', 'Consider conception timing');
                break;
            case 'Luteal':
                recommendations.push('Manage PMS symptoms', 'Practice stress reduction');
                break;
        }
        
        return recommendations.length > 0 ? recommendations : ['Stay hydrated', 'Get enough rest'];
    }

    private static compareMoodData(currentPeriodDays: IPeriodDay[], previousPeriodDays: IPeriodDay[]) {
        const currentMoods = currentPeriodDays.map(day => day.mood_data?.mood || 'neutral');
        const previousMoods = previousPeriodDays.map(day => day.mood_data?.mood || 'neutral');
        
        const currentAvgMood = this.calculateAverageMood(currentMoods);
        const previousAvgMood = this.calculateAverageMood(previousMoods);
        
        return {
            current_average_mood: currentAvgMood,
            previous_average_mood: previousAvgMood,
            mood_change: currentAvgMood === previousAvgMood ? 'stable' : 
                        currentAvgMood === 'happy' ? 'improved' : 'declined'
        };
    }

    private static calculateAverageMood(moods: string[]): string {
        if (moods.length === 0) return 'neutral';
        
        const moodScores = {
            'happy': 3,
            'good': 2,
            'neutral': 1,
            'bad': 0,
            'terrible': -1
        };
        
        const totalScore = moods.reduce((sum, mood) => sum + (moodScores[mood as keyof typeof moodScores] || 1), 0);
        const averageScore = totalScore / moods.length;
        
        if (averageScore >= 2.5) return 'happy';
        if (averageScore >= 1.5) return 'good';
        if (averageScore >= 0.5) return 'neutral';
        if (averageScore >= -0.5) return 'bad';
        return 'terrible';
    }

    public static async getMoodDataByDateRange(user_id: string, start_date: string, end_date: string) {
        try {
            const moodData = await MenstrualCycleRepository.getMoodDataByDateRange(user_id, start_date, end_date);
            
            return {
                success: true,
                data: moodData,
                message: 'Mood data retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting mood data by date range:', error);
            return {
                success: false,
                message: 'System error'
            };
        }
    }

    public static async getAllMoodData(user_id: string) {
        try {
            const moodData = await MenstrualCycleRepository.getAllMoodData(user_id);
            
            return {
                success: true,
                data: moodData,
                message: 'All mood data retrieved successfully'
            };
        } catch (error) {
            console.error('Error getting all mood data:', error);
            return {
                success: false,
                message: 'System error'
            };
        }
    }
}
