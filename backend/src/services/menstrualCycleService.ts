// service/menstrualCycle.service.ts
import mongoose from 'mongoose';
import { IMenstrualCycle } from '../models/MenstrualCycle';
import {MenstrualCycleRepository} from '../repositories/menstrualCycleRepository';
import { CycleStatsResponse, PeriodStatsResponse } from '../dto/responses/menstrualCycleResponse';

export class MenstrualCycleService {
    public static async processPeriodDays(user_id: string, period_days: Date[], notes: string){
        if (!period_days || period_days.length === 0) return [];
        if (!user_id){
            return{
                success: false,
                message: 'User ID is required'
            }
        }
        const sorted = [...period_days].sort((a, b) => a.getTime() - b.getTime());
        const groups: Date[][] = [];
        let current: Date[] = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const diff = (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
            if (diff <= 2) 
                current.push(sorted[i]);
            else {
                groups.push(current);
                current = [sorted[i]];
            }
        }
        groups.push(current);

        const cycles: IMenstrualCycle[] = [];
        for (let i = 0; i < groups.length; i++) {
            const period = groups[i];
            const start = period[0];
            const cycle: Partial<IMenstrualCycle> = {
                user_id: new mongoose.Types.ObjectId(user_id),
                cycle_start_date: start,
                period_days: period,
                notification_enabled: true,
                notification_types: ['period', 'ovulation'],
                createdAt: new Date(),
                updatedAt: new Date(),
                notes,
            };

            if (i >= 1) {
                const prevStart = groups[i - 1][0];
                const len = Math.round((start.getTime() - prevStart.getTime()) / 86400000);
                cycle.cycle_length = len;
            }

            if (cycle.cycle_length) {
                const len = cycle.cycle_length;
                const ov = len - 14;
                cycle.predicted_cycle_end = new Date(start.getTime() + len * 86400000);
                cycle.predicted_ovulation_date = new Date(start.getTime() + ov * 86400000);
                cycle.predicted_fertile_start = new Date(start.getTime() + (ov - 5) * 86400000);
                cycle.predicted_fertile_end = new Date(start.getTime() + ov * 86400000);
            }

            cycles.push(cycle as IMenstrualCycle);
        }

        if (cycles.length === 0) {
            return {
                success: false,
                message: 'No valid cycles found'
            };
        }
        await MenstrualCycleRepository.deleteCyclesByUser(user_id);
        const result = await MenstrualCycleRepository.insertCycles(cycles);
        if (!result || result.length === 0) {
            return {
                success: false,
                message: 'Failed to save cycles'
            };
        }
        return {
            success: true,
            message: 'Saving Menstrual Cycles successfully',
            data: result
        };
    }

    public static async getCycles(user_id: string) {
        try {
            const cycles = await MenstrualCycleRepository.getCyclesByUser(user_id);
            if (!cycles || cycles.length === 0) {
                return {
                    success: false,
                    message: 'No cycles found for this user'
                };
            }
            return {
                success: true,
                message: 'Cycles retrieved successfully',
                data: cycles
            };
        } catch (error) {
            console.error('Error in getCycles service:', error);
            return {
                success: false,
                message: 'Failed to retrieve cycles'
            };
        }
    }

    public static async getCyclesByMonth(user_id: string, year: number, month: number) {
        try {
            if (!year || !month || month < 1 || month > 12) {
                return {
                    success: false,
                    message: 'Invalid year or month parameter'
                };
            }

            const cycles = await MenstrualCycleRepository.getCyclesByMonth(user_id, year, month);
            if (!cycles || cycles.length === 0) {
                return {
                    success: false,
                    message: 'No cycles found for this month'
                };
            }
            return {
                success: true,
                message: 'Monthly cycles retrieved successfully',
                data: cycles
            };
        } catch (error) {
            console.error('Error in getCyclesByMonth service:', error);
            return {
                success: false,
                message: 'Failed to retrieve monthly cycles'
            };
        }
    }

    public static async updateNotificationSettings(user_id: string, settings: any) { 
        try { 
            const result = await MenstrualCycleRepository.updateNotificationByUserId(user_id, settings);
            if (!result) { 
                return { 
                    success: false, 
                    message: 'Failed to update notification settings' 
                }; 
            }
            return { 
                success: true, 
                message: 'Notification settings updated successfully', 
            };
        } 
        catch (error) { 
            console.error('Error updating notification settings:', error); 
            throw error; 
        } 
    }

    private static getTodayRecommendations(isOnPeriod: boolean, isFertile: boolean, isOvulationDay: boolean): string[] {
        const recommendations = [];
        
        if (isOnPeriod) {
            recommendations.push('Stay hydrated and rest well');
            recommendations.push('Use appropriate menstrual products');
            recommendations.push('Consider light exercise like walking');
        }
        
        if (isFertile) {
            recommendations.push('This is your fertile window');
            if (isOvulationDay) {
                recommendations.push('Peak fertility day - highest chance of conception');
            }
            recommendations.push('Track basal body temperature if trying to conceive');
        }
        
        if (!isOnPeriod && !isFertile) {
            recommendations.push('Regular daily activities');
            recommendations.push('Good time for intense workouts');
        }
        
        return recommendations;
    }

    public static async getTodayStatus(user_id: string) {
        try {
            const latestCycle = await MenstrualCycleRepository.getLatestCycles(user_id, 1);
            
            if (latestCycle.length === 0) {
                return {
                    success: false,
                    message: 'No cycle data found'
                };
            }

            const cycle = latestCycle[0];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isOnPeriod = cycle.period_days?.some(periodDay => {
                const pDay = new Date(periodDay);
                pDay.setHours(0, 0, 0, 0);
                return pDay.getTime() === today.getTime();
            });

            const isFertile = cycle.predicted_fertile_start && cycle.predicted_fertile_end &&
                            today >= new Date(cycle.predicted_fertile_start) && 
                            today <= new Date(cycle.predicted_fertile_end);

            const isOvulationDay = cycle.predicted_ovulation_date &&
                                 today.getTime() === new Date(cycle.predicted_ovulation_date).setHours(0, 0, 0, 0);

            return {
                success: true,
                data: {
                    date: today,
                    is_period_day: isOnPeriod,
                    is_fertile_day: isFertile,
                    is_ovulation_day: isOvulationDay,
                    pregnancy_chance: isFertile ? (isOvulationDay ? 'high' : 'medium') : 'low',
                    recommendations: this.getTodayRecommendations(isOnPeriod, isFertile, isOvulationDay)
                }
            };
        } catch (error) {
            console.error('Error in getTodayStatus service:', error);
            return {
                success: false,
                message: 'Failed to get today status'
            };
        }
    }

    // Các phương thức helper
    private static calculateAverage(numbers: number[]): number {
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }

    private static calculateCycleRegularity(cycleLengths: number[]): 'regular' | 'irregular' | 'very_irregular' {
        if (cycleLengths.length < 3) return 'irregular';
        
        const variance = this.calculateVariance(cycleLengths);
        
        if (variance <= 4) return 'regular';
        if (variance <= 9) return 'irregular';
        return 'very_irregular';
    }

    private static calculatePeriodRegularity(periodLengths: number[]): 'regular' | 'irregular' | 'very_irregular' {
        if (periodLengths.length < 3) return 'irregular';
        
        const variance = this.calculateVariance(periodLengths);
        
        if (variance <= 1) return 'regular';
        if (variance <= 4) return 'irregular';
        return 'very_irregular';
    }

    private static calculateVariance(numbers: number[]): number {
        const mean = this.calculateAverage(numbers);
        const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
        return this.calculateAverage(squaredDiffs);
    }

    private static calculateRegularityScore(cycleLengths: number[]): number {
        if (cycleLengths.length < 2) return 0;
        
        const variance = this.calculateVariance(cycleLengths);
        const maxScore = 100;
        const score = Math.max(0, maxScore - (variance * 5));
        
        return Math.round(score);
    }

    private static calculateTrend(recentCycles: number[]): 'stable' | 'lengthening' | 'shortening' {
        if (recentCycles.length < 3) return 'stable';
        
        const firstHalf = recentCycles.slice(Math.floor(recentCycles.length / 2));
        const secondHalf = recentCycles.slice(0, Math.floor(recentCycles.length / 2));
        
        const firstAvg = this.calculateAverage(firstHalf);
        const secondAvg = this.calculateAverage(secondHalf);
        
        const difference = firstAvg - secondAvg;
        
        if (Math.abs(difference) < 1) return 'stable';
        return difference > 0 ? 'lengthening' : 'shortening';
    }

    private static calculateMonthsDifference(startDate: Date, endDate: Date): number {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 30);
    }

    public static async getCycleStats(user_id: string): Promise<CycleStatsResponse> {
        try {
            // Lấy dữ liệu chu kỳ
            const cyclesData = await MenstrualCycleRepository.getCycleStatsData(user_id, 12);
            
            if (cyclesData.length === 0) {
                return {
                    success: false,
                    message: 'Không có dữ liệu chu kỳ để thống kê'
                };
            }

            // Tính toán thống kê chu kỳ
            const cycleLengths = cyclesData.map(cycle => cycle.cycle_length);
            const averageCycleLength = this.calculateAverage(cycleLengths);
            const shortestCycle = Math.min(...cycleLengths);
            const longestCycle = Math.max(...cycleLengths);

            // Tính độ đều đặn
            const regularity = this.calculateCycleRegularity(cycleLengths);
            const regularityScore = this.calculateRegularityScore(cycleLengths);

            // Tính xu hướng
            const recentCycles = await MenstrualCycleRepository.getRecentCycles(user_id, 6);
            const trend = this.calculateTrend(recentCycles.map(c => c.cycle_length));

            // Lấy thông tin bổ sung
            const totalCycles = await MenstrualCycleRepository.getTotalCyclesCount(user_id);
            const firstDate = await MenstrualCycleRepository.getFirstTrackingDate(user_id);
            const trackingMonths = firstDate ? this.calculateMonthsDifference(firstDate, new Date()) : 0;

            return {
                success: true,
                message: 'Lấy thống kê chu kỳ thành công',
                data: {
                    average_cycle_length: Math.round(averageCycleLength * 10) / 10,
                    shortest_cycle: shortestCycle,
                    longest_cycle: longestCycle,
                    cycle_regularity: regularity,
                    regularity_score: regularityScore,
                    trend: trend,
                    last_6_cycles: recentCycles.map(c => c.cycle_length).slice(0, 6),
                    total_cycles_tracked: totalCycles,
                    tracking_period_months: trackingMonths
                }
            };

        } catch (error) {
            console.error('Error in getCycleStats:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy thống kê chu kỳ'
            };
        }
    }

    public static async getPeriodStats(user_id: string): Promise<PeriodStatsResponse> {
        try {
            // Lấy dữ liệu kinh nguyệt
            const periodsData = await MenstrualCycleRepository.getPeriodStatsData(user_id, 12);
            
            if (periodsData.length === 0) {
                return {
                    success: false,
                    message: 'Không có dữ liệu kinh nguyệt để thống kê'
                };
            }

            // Tính toán thống kê kinh nguyệt
            const periodLengths = periodsData.map(period => period.period_days);
            const averagePeriodLength = this.calculateAverage(periodLengths);
            const shortestPeriod = Math.min(...periodLengths);
            const longestPeriod = Math.max(...periodLengths);

            // Tính độ đều đặn của kinh nguyệt
            const periodRegularity = this.calculatePeriodRegularity(periodLengths);

            // Lấy 3 kỳ kinh gần nhất
            const last3Periods = periodsData.slice(0, 3).map(period => ({
                start_date: period.cycle_start_date.toISOString().split('T')[0],
                length: period.period_days,
                notes: period.notes
            }));

            return {
                success: true,
                message: 'Lấy thống kê kinh nguyệt thành công',
                data: {
                    average_period_length: Math.round(averagePeriodLength * 10) / 10,
                    shortest_period: shortestPeriod,
                    longest_period: longestPeriod,
                    period_regularity: periodRegularity,
                    last_3_periods: last3Periods,
                    total_periods_tracked: periodsData.length
                }
            };

        } catch (error) {
            console.error('Error in getPeriodStats:', error);
            return {
                success: false,
                message: 'Lỗi khi lấy thống kê kinh nguyệt'
            };
        }
    }

}