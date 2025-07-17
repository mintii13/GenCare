// service/menstrualCycle.service.ts
import mongoose from 'mongoose';
import { IMenstrualCycle } from '../models/MenstrualCycle';
import {MenstrualCycleRepository} from '../repositories/menstrualCycleRepository';
import { CycleStatsResponse, PeriodStatsResponse, RegularityStatus, TrendStatus } from '../dto/responses/menstrualCycleResponse';

export class MenstrualCycleService {
    public static async processPeriodDays(user_id: string, period_days: Date[], notes: string){
        // Defect D2: Empty period_days
        if (!period_days || period_days.length === 0) {
            return {
                success: false,
                message: 'Period days are required.'
            };
        }
        if (!user_id){
            return{
                success: false,
                message: 'User ID is required'
            }
        }

        // Defect D3: Notes length
        if (notes && notes.length > 500) {
            return {
                success: false,
                message: 'Notes cannot exceed 500 characters'
            };
        }

        // Defect D1: Future date check
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        for (const day of period_days) {
            if (new Date(day) > today) {
                return {
                    success: false,
                    message: 'Cannot log period days in the future.'
                };
            }
        }

        console.log(' Processing period days:', period_days.map(d => d.toISOString().split('T')[0]));

        // Normalize dates to avoid timezone issues
        const normalizedDates = period_days.map(date => {
            const normalized = new Date(date);
            normalized.setUTCHours(0, 0, 0, 0);
            return normalized;
        });

        console.log('Normalized dates:', normalizedDates.map(d => d.toISOString().split('T')[0]));  
        // Remove duplicates based on date string

        const sorted = [...normalizedDates].sort((a, b) => a.getTime() - b.getTime());
        console.log('Sorted dates:', sorted.map(d => d.toISOString().split('T')[0]));
     
        // SIMPLE GROUPING: Consecutive days = same cycle
        const groups: Date[][] = [];
        let current: Date[] = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const currentDate = sorted[i];
            const prevDate = sorted[i - 1];
            
            // Tính diff bằng ngày
            const diffMs = currentDate.getTime() - prevDate.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
            
            console.log(`Date diff between ${prevDate.toISOString().split('T')[0]} and ${currentDate.toISOString().split('T')[0]}: ${diffDays} days`);
            
            // LOGIC ĐỠN GIẢN: Nếu liền nhau (1 ngày) thì cùng chu kì, không thì chu kì mới
            if (diffDays === 1) {
                current.push(currentDate);
                console.log(`Consecutive day - adding to current cycle: ${currentDate.toISOString().split('T')[0]}`);
            } else {
                console.log(`Gap detected (${diffDays} days) - starting new cycle at: ${currentDate.toISOString().split('T')[0]}`);
                groups.push(current);
                current = [currentDate];
            }
        }
        groups.push(current);

        console.log('Final groups:', groups.map(group => 
            group.map(d => d.toISOString().split('T')[0])
        ));

        // Validate groups - kiểm tra logic grouping
        console.log('Validating groups...');
        groups.forEach((group, index) => {
            console.log(`Group ${index + 1}:`, {
                dates: group.map(d => d.toISOString().split('T')[0]),
                span: group.length > 1 ? `${Math.round((group[group.length - 1].getTime() - group[0].getTime()) / (1000 * 60 * 60 * 24))} days` : '1 day',
                startMonth: group[0].getUTCMonth() + 1,
                endMonth: group[group.length - 1].getUTCMonth() + 1
            });
        });

        // Final validation: check for suspicious groupings
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            if (group.length > 1) {
                const span = Math.round((group[group.length - 1].getTime() - group[0].getTime()) / (1000 * 60 * 60 * 24));
                if (span > 30) {
                    console.warn(`Warning: Group ${i + 1} spans ${span} days, might be multiple cycles`);
                }
            }
        }

        const cycles: IMenstrualCycle[] = [];
        const cycle_lengths: number[] = [];
        
        for (let i = 0; i < groups.length; i++) {
            const period = groups[i];
            const start = period[0];
            
            console.log(`Creating cycle ${i + 1} with start date: ${start.toISOString().split('T')[0]}`);
            
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

            if (i + 1 < groups.length) {
                const nextStart = groups[i + 1][0];
                const timeDiff = nextStart.getTime() - start.getTime();
                const len = Math.round(timeDiff / (1000 * 60 * 60 * 24));
                cycle.cycle_length = len;
                cycle_lengths.push(len);
                console.log(`Cycle length: ${len} days (from ${start.toISOString().split('T')[0]} to ${nextStart.toISOString().split('T')[0]})`);
            } else {
                cycle.cycle_length = 0;
                console.log(`Last cycle (no next cycle) — cycle_length is undefined`);
            }
            cycles.push(cycle as IMenstrualCycle);
        }
        console.log('Creating cycles from groups...');
        const regularity = this.calculateCycleRegularity(cycle_lengths);
        console.log('Calculated regularity (initial):', regularity);

        for (let i = 0; i < cycles.length; i++) {
            const cycle = cycles[i];
            
            // For the first cycle or cycles without cycle_length, use standard 28-day cycle for predictions
            let len = cycle.cycle_length;
            if (!len) {
                len = 28; // Use standard cycle length for first cycle
                console.log(`Using standard 28-day cycle for predictions (cycle ${i + 1})`);
            }
            
            console.log(`Processing predictions for cycle ${i + 1}, length: ${len} days, regularity: ${regularity}`);
            
            // Allow predictions for reasonable cycle lengths (21-35 days)
            if (len >= 21 && len <= 35) {
                const ov = len - 14;
                const start = cycle.cycle_start_date.getTime();
                
                cycle.predicted_cycle_end = new Date(start + len * 86400000);
                cycle.predicted_ovulation_date = new Date(start + ov * 86400000);
                cycle.predicted_fertile_start = new Date(start + (ov - 5) * 86400000);
                cycle.predicted_fertile_end = new Date(start + (ov + 1) * 86400000);
            }
            else{
                cycle.predicted_cycle_end = null;
                cycle.predicted_ovulation_date = null;
                cycle.predicted_fertile_start = null;
                cycle.predicted_fertile_end = null;
                console.log(`No predictions for cycle ${i + 1} - length: ${len}, regularity: ${regularity}`);
            }
        }

        if (cycles.length === 0) {
            console.error('No valid cycles created');
            return {
                success: false,
                message: 'No valid cycles found'
            };
        }
        
        console.log('Saving cycles to database...');
        console.log('Final cycles summary:', cycles.map((cycle, index) => ({
            cycleNum: index + 1,
            startDate: cycle.cycle_start_date.toISOString().split('T')[0],
            periodDays: cycle.period_days.map(d => d.toISOString().split('T')[0]),
            cycleLength: cycle.cycle_length || 'N/A',
            hasPredictions: !!cycle.predicted_cycle_end
        })));
        
        await MenstrualCycleRepository.deleteCyclesByUser(user_id);
        const result = await MenstrualCycleRepository.insertCycles(cycles);
        
        if (!result || result.length === 0) {
            console.error('Failed to save cycles to database');
            return {
                success: false,
                message: 'Failed to save cycles'
            };
        }
        
        console.log('Successfully saved cycles:', result.length);
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
                // User chưa có dữ liệu chu kỳ - đây là normal với user mới
                return {
                    success: true,
                    message: 'No menstrual cycle data yet. Start tracking your period to get predictions.',
                    data: []
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
                // User chưa có dữ liệu tháng này - normal với user mới hoặc tháng chưa track
                return {
                    success: true,
                    message: 'No cycle data for this month yet.',
                    data: []
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
            if (!settings || Object.keys(settings).length === 0){
                return{
                    success: false,
                    message: 'Nothing to update'
                }
            }

            // Defect D6: Whitelist allowed fields to prevent malicious updates
            const allowedFields = ['notification_enabled', 'notification_types'];
            const validSettings: any = {};

            for (const key of allowedFields) {
                if (settings.hasOwnProperty(key)) {
                    // Thêm validation chi tiết hơn nếu cần
                    // Ví dụ: kiểm tra notification_types là một mảng các giá trị hợp lệ
                    validSettings[key] = settings[key];
                }
            }

            if (Object.keys(validSettings).length === 0) {
                return {
                    success: false,
                    message: 'No valid fields to update.'
                };
            }

            const result = await MenstrualCycleRepository.updateNotificationByUserId(user_id, validSettings);
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
            recommendations.push('Uống nhiều nước và nghỉ ngơi đầy đủ');
            recommendations.push('Sử dụng sản phẩm vệ sinh phụ nữ phù hợp');
            recommendations.push('Tập thể dục nhẹ nhàng như đi bộ');
        }
        
        if (isFertile) {
            recommendations.push('Đây là giai đoạn rụng trứng của bạn');
            if (isOvulationDay) {
                recommendations.push('Ngày rụng trứng - khả năng thụ thai cao nhất');
            }
            recommendations.push('Theo dõi nhiệt độ cơ thể nếu muốn có con');
        }
        
        if (!isOnPeriod && !isFertile) {
            recommendations.push('Hoạt động bình thường hàng ngày');
            recommendations.push('Thời điểm tốt để tập luyện cường độ cao');
        }
        
        return recommendations;
    }

    public static async getTodayStatus(user_id: string) {
        try {
            const latestCycle = await MenstrualCycleRepository.getLatestCycles(user_id, 1);
            
            if (latestCycle.length === 0) {
                // User mới chưa có dữ liệu - trả về default status
                return {
                    success: true,
                    message: 'No tracking data yet. Start tracking your period for personalized insights.',
                    data: {
                        date: new Date(),
                        is_period_day: false,
                        is_fertile_day: false,
                        is_ovulation_day: false,
                        pregnancy_chance: 'unknown',
                        recommendations: [
                            'Bắt đầu theo dõi chu kỳ kinh nguyệt để nhận thông tin cá nhân hóa',
                            'Ghi lại ngày đầu của kỳ kinh nguyệt tiếp theo',
                            'Duy trì lối sống lành mạnh với chế độ ăn cân bằng'
                        ]
                    }
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

    private static calculateCycleRegularity(cycleLengths: number[]): RegularityStatus{
        if (cycleLengths.length < 3) 
            return 'insufficient_data';
        const allInRange = cycleLengths.every(length => length >= 21 && length <= 35);

        // Nếu chu kỳ kinh nguyệt nằm từ 21-35 thì ok, còn có giá trị chu kỳ out scope thì xem như bất bình thường
        if (allInRange) 
            return 'regular';       
        return 'irregular';
    }

    private static calculatePeriodRegularity(periodLengths: number[]): RegularityStatus{
        if (periodLengths.length < 3) 
            return 'insufficient_data';
        const allInRange = periodLengths.every(length => length >= 2 && length <= 7);

        // Nếu số ngày hành kinh nằm từ 2-7 thì ok, còn có giá trị chu kỳ out scope thì xem như bất bình thường
        if (allInRange) 
            return 'regular';       
        return 'irregular';
    }

    private static calculateTrend(recentCycles: number[]): TrendStatus {
        if (recentCycles.length < 3) 
            return 'stable';
        
        const firstHalf = recentCycles.slice(Math.floor(recentCycles.length / 2));
        const secondHalf = recentCycles.slice(0, Math.floor(recentCycles.length / 2));
        
        const firstAvg = this.calculateAverage(firstHalf);
        const secondAvg = this.calculateAverage(secondHalf);
        
        const difference = firstAvg - secondAvg;
        
        if (Math.abs(difference) < 1) 
            return 'stable';
        return difference >= 1 ? 'lengthening' : 'shortening';
    }

    private static calculateMonthsDifference(startDate: Date, endDate: Date): number {
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.floor(diffDays / 30);
    }

    public static async getCycleStats(user_id: string): Promise<CycleStatsResponse> {
        try {
            // Lấy dữ liệu chu kỳ
            const cyclesData = await MenstrualCycleRepository.getCycleStatsData(user_id, 6);

            
            if (cyclesData.length === 0) {
                // User mới chưa có đủ dữ liệu cho thống kê
                return {
                    success: true,
                    message: 'Track at least 2-3 cycles to see detailed statistics',
                    data: {
                        average_cycle_length: 0,
                        shortest_cycle: 0,
                        longest_cycle: 0,
                        cycle_regularity: 'insufficient_data',
                        trend: 'stable',
                        last_6_cycles: [],
                        total_cycles_tracked: 0,
                        tracking_period_months: 0
                    }
                };
            }

            // Tính toán thống kê chu kỳ
            const cycleLengths = cyclesData.map(cycle => cycle.cycle_length);
            const averageCycleLength = this.calculateAverage(cycleLengths);
            const shortestCycle = Math.min(...cycleLengths);
            const longestCycle = Math.max(...cycleLengths);

            // Tính độ đều đặn
            const regularity = this.calculateCycleRegularity(cycleLengths);

            // Tính xu hướng
            const recentCycles = await MenstrualCycleRepository.getRecentCycles(user_id, 6);
            const trend = this.calculateTrend(recentCycles.map(c => c.cycle_length));

            // Lấy thông tin bổ sung
            const totalCycles = await MenstrualCycleRepository.getTotalCyclesCount(user_id);
            const firstDate = await MenstrualCycleRepository.getFirstTrackingDate(user_id);
            const trackingMonths = firstDate ? this.calculateMonthsDifference(firstDate, new Date()) : 0;

            const last6Cycles = recentCycles.slice(0, 6).map(c => ({
                start_date: c.cycle_start_date.toISOString().slice(0, 10),
                length: c.cycle_length
            }));
            return {
                success: true,
                message: 'Get Cycle Statistics successfully',
                data: {
                    average_cycle_length: Math.round(averageCycleLength * 10) / 10,
                    shortest_cycle: shortestCycle,
                    longest_cycle: longestCycle,
                    cycle_regularity: regularity,
                    trend: trend,
                    last_6_cycles: last6Cycles,
                    total_cycles_tracked: totalCycles,
                    tracking_period_months: trackingMonths
                }
            };

        } catch (error) {
            console.error('Error in getCycleStats:', error);
            return {
                success: false,
                message: 'Error when getting cycle statistics'
            };
        }
    }

    public static async getPeriodStats(user_id: string): Promise<PeriodStatsResponse> {
        try {
            // Lấy dữ liệu kinh nguyệt
            const periodsData = await MenstrualCycleRepository.getPeriodStatsData(user_id, 12);
            
            if (periodsData.length === 0) {
                // User mới chưa có dữ liệu kinh nguyệt
                return {
                    success: true,
                    message: 'Track at least 2-3 periods to see detailed statistics',
                    data: {
                        average_period_length: 0,
                        shortest_period: 0,
                        longest_period: 0,
                        period_regularity: 'insufficient_data',
                        last_3_periods: [],
                        total_periods_tracked: 0
                    }
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
                message: 'Error when getting period statistics'
            };
        }
    }

    public static async cleanupDuplicates(user_id: string) {
        try {
            const cycles = await MenstrualCycleRepository.getCyclesByUser(user_id);
            
            if (!cycles || cycles.length === 0) {
                // User mới chưa có dữ liệu - không cần cleanup
                return {
                    success: true,
                    message: 'No cycle data to clean up',
                    data: {
                        duplicatesRemoved: 0,
                        duplicatesFound: []
                    }
                };
            }

            // Collect all period days across all cycles
            const allPeriodDays: { date: string, cycleId: string }[] = [];
            const duplicatesFound: { date: string, cycles: string[] }[] = [];
            
            cycles.forEach(cycle => {
                cycle.period_days.forEach(periodDay => {
                    const dateKey = new Date(periodDay).toISOString().split('T')[0];
                    allPeriodDays.push({
                        date: dateKey,
                        cycleId: cycle._id.toString()
                    });
                });
            });

            // Find duplicates
            const dateMap = new Map<string, string[]>();
            allPeriodDays.forEach(item => {
                if (!dateMap.has(item.date)) {
                    dateMap.set(item.date, []);
                }
                dateMap.get(item.date)!.push(item.cycleId);
            });

            // Identify duplicates
            dateMap.forEach((cycleIds, date) => {
                if (cycleIds.length > 1) {
                    duplicatesFound.push({
                        date,
                        cycles: cycleIds
                    });
                }
            });

            if (duplicatesFound.length === 0) {
                return {
                    success: true,
                    message: 'No duplicates found',
                    data: {
                        duplicatesRemoved: 0,
                        duplicatesFound: []
                    }
                };
            }

            // Clean up duplicates - keep the earliest cycle and remove from others
            let duplicatesRemoved = 0;
            
            for (const duplicate of duplicatesFound) {
                const involvedCycles = cycles.filter(c => 
                    duplicate.cycles.includes(c._id.toString())
                );
                
                // Sort by cycle start date, keep the earliest
                involvedCycles.sort((a, b) => 
                    new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()
                );
                
                // Remove duplicate date from all but the first cycle
                for (let i = 1; i < involvedCycles.length; i++) {
                    const cycle = involvedCycles[i];
                    const originalLength = cycle.period_days.length;
                    
                    cycle.period_days = cycle.period_days.filter(pd => {
                        const dateKey = new Date(pd).toISOString().split('T')[0];
                        return dateKey !== duplicate.date;
                    });
                    
                    if (cycle.period_days.length < originalLength) {
                        await MenstrualCycleRepository.updateCycle(cycle._id.toString(), cycle);
                        duplicatesRemoved++;
                    }
                }
            }

            return {
                success: true,
                message: `Cleaned up ${duplicatesRemoved} duplicate period days`,
                data: {
                    duplicatesRemoved,
                    duplicatesFound: duplicatesFound.map(d => ({
                        date: d.date,
                        cycleCount: d.cycles.length
                    }))
                }
            };

        } catch (error) {
            console.error('Error in cleanupDuplicates:', error);
            return {
                success: false,
                message: 'Failed to cleanup duplicates'
            };
        }
    }

    public static async resetAllData(user_id: string) {
        try {
            const result = await MenstrualCycleRepository.deleteCyclesByUser(user_id);
            
            return {
                success: true,
                message: `Đã xóa tất cả dữ liệu chu kỳ của user`,
                data: {
                    deletedCount: result.deletedCount || 0
                }
            };

        } catch (error) {
            console.error('Error in resetAllData:', error);
            return {
                success: false,
                message: 'Failed to reset all data'
            };
        }
    }

}
