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
        if (!user_id) {
            return {
                success: false,
                message: 'User ID is required'
            };
        }

        if (!request.period_days || request.period_days.length === 0) {
            return {
                success: false,
                message: 'Period days are required.'
            };
        }

        // Validate dates and mood data
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        for (const periodDay of request.period_days) {
            const periodDate = new Date(periodDay.date);
            if (periodDate > today) {
                return {
                    success: false,
                    message: 'Cannot log period days in the future.'
                };
            }
            if (periodDate < sixMonthsAgo) {
                return {
                    success: false,
                    message: 'Cannot log period days more than 6 months in the past.'
                };
            }
        }

        try {
            console.log('[MenstrualCycleService] Processing cycle with mood data for user:', user_id);
            console.log('[MenstrualCycleService] Request data:', JSON.stringify(request, null, 2));
            
            // Convert to IPeriodDay format
            const periodDays: IPeriodDay[] = request.period_days.map(pd => ({
                date: new Date(pd.date),
                mood_data: pd.mood_data
            }));

            console.log('[MenstrualCycleService] Converted period days:', JSON.stringify(periodDays, null, 2));

            // Sort by date
            const sortedPeriodDays = periodDays.sort((a, b) => a.date.getTime() - b.date.getTime());

            // Group consecutive days into cycles
            const cycles = this.groupPeriodDaysIntoCycles(sortedPeriodDays);
            console.log('[MenstrualCycleService] Grouped cycles:', cycles.length, 'cycles');

            // Save each cycle
            const savedCycles = [];
            for (const cycle of cycles) {
                // Calculate personalized cycle length for this user
                const personalizedCycleLength = await this.calculateAverageCycleLength(user_id);
                
                const cycleData = {
                    user_id: new mongoose.Types.ObjectId(user_id),
                    cycle_start_date: cycle[0].date,
                    period_days: cycle,
                    cycle_length: this.calculateCycleLength(cycle), // Keep period length
                    predicted_cycle_end: this.predictCycleEnd(cycle[0].date, personalizedCycleLength),
                    predicted_ovulation_date: this.predictOvulationDate(cycle[0].date, personalizedCycleLength),
                    predicted_fertile_start: this.predictFertileStart(cycle[0].date, personalizedCycleLength),
                    predicted_fertile_end: this.predictFertileEnd(cycle[0].date, personalizedCycleLength)
                };

                console.log('[MenstrualCycleService] Saving cycle data:', JSON.stringify(cycleData, null, 2));

                const savedCycle = await MenstrualCycleRepository.create(cycleData);
                console.log('[MenstrualCycleService] Saved cycle:', savedCycle._id);
                savedCycles.push(savedCycle);
            }

            return {
                success: true,
                message: `Successfully processed ${cycles.length} cycle(s)`,
                data: savedCycles
            };

        } catch (error) {
            console.error('Error processing cycle with mood data:', error);
            return {
                success: false,
                message: 'Failed to process cycle data'
            };
        }
    }

    // Helper method to group period days into cycles
    private static groupPeriodDaysIntoCycles(periodDays: IPeriodDay[]): IPeriodDay[][] {
        const groups: IPeriodDay[][] = [];
        let current: IPeriodDay[] = [periodDays[0]];

        for (let i = 1; i < periodDays.length; i++) {
            const currentDate = periodDays[i].date;
            const prevDate = periodDays[i - 1].date;
            
            const diffMs = currentDate.getTime() - prevDate.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                current.push(periodDays[i]);
            } else {
                // Chỉ lưu chu kỳ có độ dài hợp lý (5-7 ngày)
                if (current.length >= 5 && current.length <= 7) {
                    groups.push(current);
                } else {
                    console.log(`[MenstrualCycleService] Bỏ qua chu kỳ có ${current.length} ngày (không hợp lý)`);
                }
                current = [periodDays[i]];
            }
        }
        
        // Kiểm tra chu kỳ cuối cùng
        if (current.length >= 5 && current.length <= 7) {
            groups.push(current);
        } else {
            console.log(`[MenstrualCycleService] Bỏ qua chu kỳ cuối có ${current.length} ngày (không hợp lý)`);
        }
        
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
        
        // Calculate days between first and last period day
        const periodLength = Math.floor((lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // For now, use a default cycle length of 28 days
        // In a real application, you would calculate this based on historical data
        return 28;
    }

    // New method to calculate average cycle length from user's historical data
    private static async calculateAverageCycleLength(user_id: string): Promise<number> {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (!cycles || cycles.length < 2) {
                return 28; // Default if not enough data
            }
            
            // Sort cycles by start date
            const sortedCycles = cycles.sort((a, b) => 
                new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()
            );
            
            let totalDays = 0;
            let cycleCount = 0;
            
            // Calculate cycle lengths between consecutive cycles
            for (let i = 1; i < sortedCycles.length; i++) {
                const currentCycleStart = new Date(sortedCycles[i].cycle_start_date);
                const previousCycleStart = new Date(sortedCycles[i-1].cycle_start_date);
                
                const daysBetween = Math.floor((currentCycleStart.getTime() - previousCycleStart.getTime()) / (1000 * 60 * 60 * 24));
                
                // Only count if it's a reasonable cycle length (21-35 days)
                if (daysBetween >= 21 && daysBetween <= 35) {
                    totalDays += daysBetween;
                    cycleCount++;
                }
            }
            
            if (cycleCount === 0) {
                return 28; // Default if no valid cycles found
            }
            
            const averageCycleLength = Math.round(totalDays / cycleCount);
            
            // Ensure the result is within normal range
            return Math.max(21, Math.min(35, averageCycleLength));
            
        } catch (error) {
            console.error('Error calculating average cycle length:', error);
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
        const ovulationDay = Math.round(cycleLength / 2); // Ovulation typically occurs at mid-cycle
        ovulationDate.setDate(ovulationDate.getDate() + ovulationDay);
        return ovulationDate;
    }

    private static predictFertileStart(startDate: Date, cycleLength: number = 28): Date {
        const fertileStart = new Date(startDate);
        const ovulationDay = Math.round(cycleLength / 2);
        const fertileWindowStart = ovulationDay - 3; // Fertile window starts 3 days before ovulation
        fertileStart.setDate(fertileStart.getDate() + fertileWindowStart);
        return fertileStart;
    }

    private static predictFertileEnd(startDate: Date, cycleLength: number = 28): Date {
        const fertileEnd = new Date(startDate);
        const ovulationDay = Math.round(cycleLength / 2);
        const fertileWindowEnd = ovulationDay + 2; // Fertile window ends 2 days after ovulation
        fertileEnd.setDate(fertileEnd.getDate() + fertileWindowEnd);
        return fertileEnd;
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
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (!cycles || cycles.length === 0) {
                return {
                    success: false,
                    message: 'Chưa có dữ liệu chu kỳ'
                };
            }

            // Sort cycles by start date
            const sortedCycles = cycles.sort((a, b) => 
                new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()
            );

            // Calculate cycle lengths
            const cycleLengths = [];
            for (let i = 1; i < sortedCycles.length; i++) {
                const currentStart = new Date(sortedCycles[i].cycle_start_date);
                const previousStart = new Date(sortedCycles[i-1].cycle_start_date);
                const daysBetween = Math.floor((currentStart.getTime() - previousStart.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysBetween >= 21 && daysBetween <= 35) {
                    cycleLengths.push(daysBetween);
                }
            }

            const averageCycleLength = cycleLengths.length > 0 ? 
                Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length) : 28;

            const shortestCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : 28;
            const longestCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : 28;

            // Determine regularity
            let cycleRegularity = 'insufficient_data';
            if (cycleLengths.length >= 3) {
                const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - averageCycleLength, 2), 0) / cycleLengths.length;
                const standardDeviation = Math.sqrt(variance);
                cycleRegularity = standardDeviation <= 3 ? 'regular' : 'irregular';
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

            // Get last 6 cycles
            const last6Cycles = sortedCycles.slice(-6).map((cycle, index) => {
                const cycleLength = index === 0 ? 28 : 
                    Math.floor((new Date(cycle.cycle_start_date).getTime() - 
                               new Date(sortedCycles[sortedCycles.length - 7 + index].cycle_start_date).getTime()) / (1000 * 60 * 60 * 24));
                return {
                    start_date: cycle.cycle_start_date,
                    length: cycleLength >= 21 && cycleLength <= 35 ? cycleLength : 28
                };
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
            console.error('Error getting cycle statistics:', error);
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
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
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
            const cycleLength = await this.calculateAverageCycleLength(user_id);
            
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
            const ovulationDay = Math.round(cycleLength / 2); // Ovulation typically occurs at mid-cycle
            const menstrualPhaseEnd = 5; // First 5 days are typically menstrual
            const follicularPhaseEnd = ovulationDay - 1; // Follicular phase until ovulation
            
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

            // Check if today is fertile or ovulation day based on predictions
            const isOvulationDay = latestCycle.predicted_ovulation_date && 
                new Date(latestCycle.predicted_ovulation_date).toDateString() === today.toDateString();
            
            const isFertileDay = latestCycle.predicted_fertile_start && latestCycle.predicted_fertile_end &&
                today >= new Date(latestCycle.predicted_fertile_start) && 
                today <= new Date(latestCycle.predicted_fertile_end);

            const todayStatus: TodayStatus = {
                date: today.toISOString().split('T')[0],
                is_period_day: isPeriodDay,
                is_fertile_day: isFertileDay,
                is_ovulation_day: isOvulationDay,
                pregnancy_chance: isFertileDay ? 'high' : isOvulationDay ? 'very_high' : 'low',
                recommendations: this.getRecommendations(cyclePhase, isPeriodDay, isFertileDay, isOvulationDay),
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
}
