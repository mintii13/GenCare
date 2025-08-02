// service/menstrualCycle.service.ts
import mongoose from 'mongoose';
import { IMenstrualCycle, MenstrualCycle } from '../models/MenstrualCycle';
import { MenstrualCycleRepository } from '../repositories/menstrualCycleRepository';
import { 
    CycleData, 
    TodayStatus, 
    CycleStatistics, 
    PeriodStatistics
} from '../dto/responses/menstrualCycleResponse';

// Define types for backward compatibility
type RegularityStatus = 'regular' | 'irregular' | 'insufficient_data';
type TrendStatus = 'stable' | 'lengthening' | 'shortening';

// Constants for validation
const CYCLE_CONSTRAINTS = {
    MIN_CYCLE_LENGTH: 21,
    MAX_CYCLE_LENGTH: 45,
    MIN_PERIOD_LENGTH: 2,
    MAX_PERIOD_LENGTH: 10,
    MAX_DAYS_BETWEEN_PERIODS: 3, // Để group consecutive days
    MAX_FUTURE_DAYS: 0 // Không cho phép ngày trong tương lai
};

export class MenstrualCycleService {
    // Process cycle with simple period days
    public static async processCycle(user_id: string, period_days: string[]) {
        try {
            console.log('[MenstrualCycleService] processCycle called with:', {
                user_id,
                periodDaysCount: period_days?.length,
                periodDays: period_days
            });

            if (!period_days || period_days.length === 0) {
                throw new Error('No period days provided');
            }

            // Convert string dates to Date objects and validate
            const sortedPeriodDays: Date[] = period_days.map(dateString => {
                const date = new Date(dateString);
                
                // Validate date format
                if (isNaN(date.getTime())) {
                    console.error('[MenstrualCycleService] Invalid date:', dateString);
                    throw new Error(`Ngày không hợp lệ: ${dateString}`);
                }
                
                // Validate future dates with proper timezone handling
                const today = new Date();
                const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                
                console.log('[MenstrualCycleService] Date validation:', {
                    inputDate: dateString,
                    parsedDate: date.toISOString(),
                    dateLocal: dateLocal.toISOString(),
                    today: today.toISOString(),
                    todayLocal: todayLocal.toISOString(),
                    isFuture: dateLocal > todayLocal
                });
                
                if (dateLocal > todayLocal) {
                    console.error('[MenstrualCycleService] Future date not allowed:', dateString);
                    throw new Error(`Không thể thêm ngày trong tương lai: ${dateString}`);
                }
                
                return date;
            });

            // Sort by date to ensure chronological order
            sortedPeriodDays.sort((a, b) => a.getTime() - b.getTime());

            console.log('[MenstrualCycleService] Converted and sorted period days:', {
                count: sortedPeriodDays.length,
                dates: sortedPeriodDays.map(date => date.toISOString().split('T')[0])
            });

            // Get existing cycles
            const existingCycles = await MenstrualCycleRepository.findByUser(user_id);
            console.log('[MenstrualCycleService] Existing cycles:', existingCycles.length);

            // Group consecutive days into cycles
            const groupedCycles = this.groupConsecutivePeriodDays(sortedPeriodDays);
            console.log('[MenstrualCycleService] Grouped cycles:', {
                totalGroups: groupedCycles.length,
                groups: groupedCycles.map(group => ({
                    count: group.length,
                    startDate: group[0].toISOString().split('T')[0],
                    endDate: group[group.length - 1].toISOString().split('T')[0]
                }))
            });

            // Validate each cycle group
            for (const cycleDays of groupedCycles) {
                // Validate period length
                if (cycleDays.length < CYCLE_CONSTRAINTS.MIN_PERIOD_LENGTH) {
                    console.warn('[MenstrualCycleService] Short period detected:', cycleDays.length, 'days');
                    // Có thể là spotting, nhưng vẫn cho phép
                }
                
                if (cycleDays.length > CYCLE_CONSTRAINTS.MAX_PERIOD_LENGTH) {
                    console.warn('[MenstrualCycleService] Long period detected:', cycleDays.length, 'days');
                    // Cảnh báo nhưng vẫn cho phép
                }
            }

            // Validate gaps between cycle groups
            for (let i = 0; i < groupedCycles.length - 1; i++) {
                const currentGroup = groupedCycles[i];
                const nextGroup = groupedCycles[i + 1];
                
                const currentEnd = currentGroup[currentGroup.length - 1];
                const nextStart = nextGroup[0];
                
                const daysBetween = Math.floor((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60 * 24));
                
                console.log('[MenstrualCycleService] Gap between cycles:', {
                    cycle1End: currentEnd.toISOString().split('T')[0],
                    cycle2Start: nextStart.toISOString().split('T')[0],
                    daysBetween
                });
                
                // If gap is too large, they should be separate cycles
                if (daysBetween > CYCLE_CONSTRAINTS.MAX_CYCLE_LENGTH) {
                    console.warn('[MenstrualCycleService] Large gap detected between cycles:', daysBetween, 'days');
                }
            }

            // Process each cycle group
            const processedCycles = [];
            const cyclesToDelete = [];
            
            for (const cycleDays of groupedCycles) {
                const cycleStartDate = cycleDays[0];
                
                // Find all overlapping cycles using smart merge logic
                const overlappingCycles = existingCycles.filter(existingCycle => {
                    return this.shouldMergeCycles(existingCycle, cycleDays, cycleStartDate);
                });

                if (overlappingCycles.length > 0) {
                    // Merge all overlapping cycles with new period days
                    console.log('[MenstrualCycleService] Merging', overlappingCycles.length, 'overlapping cycles');
                    
                    // Collect all period days from overlapping cycles
                    let allPeriodDays = [...cycleDays];
                    overlappingCycles.forEach(cycle => {
                        allPeriodDays = [...allPeriodDays, ...cycle.period_days];
                        cyclesToDelete.push(cycle._id);
                    });
                    
                    // Remove duplicates and sort
                    const uniquePeriodDays = allPeriodDays.filter((date, index, self) => 
                        index === self.findIndex(d => d.getTime() === date.getTime())
                    );
                    uniquePeriodDays.sort((a, b) => a.getTime() - b.getTime());
                    
                    // Recalculate cycle properties
                    const newCycleStartDate = uniquePeriodDays[0];
                    const cycleLength = await this.calculatePersonalizedCycleLength(user_id, newCycleStartDate);
                    
                const cycleData = {
                    user_id: new mongoose.Types.ObjectId(user_id),
                        cycle_start_date: newCycleStartDate,
                        period_days: uniquePeriodDays,
                    cycle_length: cycleLength,
                        predicted_cycle_end: this.predictCycleEnd(newCycleStartDate, cycleLength),
                        predicted_ovulation_date: this.predictOvulationDate(newCycleStartDate, cycleLength),
                        predicted_fertile_start: this.predictFertileStart(newCycleStartDate, cycleLength),
                        predicted_fertile_end: this.predictFertileEnd(newCycleStartDate, cycleLength)
                    };

                    const newCycle = await MenstrualCycleRepository.create(cycleData);
                    processedCycles.push(newCycle._id);
                } else {
                    // Create new cycle
                    console.log('[MenstrualCycleService] Creating new cycle');
                    const cycleLength = await this.calculatePersonalizedCycleLength(user_id, cycleStartDate);
                    
                    const cycleData = {
                        user_id: new mongoose.Types.ObjectId(user_id),
                        cycle_start_date: cycleStartDate,
                        period_days: cycleDays,
                        cycle_length: cycleLength,
                        predicted_cycle_end: this.predictCycleEnd(cycleStartDate, cycleLength),
                        predicted_ovulation_date: this.predictOvulationDate(cycleStartDate, cycleLength),
                        predicted_fertile_start: this.predictFertileStart(cycleStartDate, cycleLength),
                        predicted_fertile_end: this.predictFertileEnd(cycleStartDate, cycleLength)
                    };

                    const newCycle = await MenstrualCycleRepository.create(cycleData);
                    processedCycles.push(newCycle._id);
                }
            }
            
            // Delete old overlapping cycles
            if (cyclesToDelete.length > 0) {
                console.log('[MenstrualCycleService] Deleting', cyclesToDelete.length, 'old overlapping cycles');
                for (const cycleId of cyclesToDelete) {
                    await MenstrualCycle.findByIdAndDelete(cycleId);
                }
            }

            return {
                success: true,
                message: `Đã xử lý thành công ${processedCycles.length} chu kỳ`,
                data: {
                    processed_cycles: processedCycles.length,
                    cycle_ids: processedCycles
                }
            };

        } catch (error) {
            console.error('[MenstrualCycleService] Error processing cycle:', error);
            throw error;
        }
    }

    // Calculate PMS window
    private static calculatePMSWindow(
        cycleStartDate: Date, 
        cycleLength: number
    ): { start: Date, end: Date } {
        const pmsStart = new Date(cycleStartDate);
        pmsStart.setDate(pmsStart.getDate() + cycleLength - 7);
        
        const pmsEnd = new Date(cycleStartDate);
        pmsEnd.setDate(pmsEnd.getDate() + cycleLength - 1);
        
        return { start: pmsStart, end: pmsEnd };
    }

    // Detect potential pregnancy
    public static async detectPotentialPregnancy(user_id: string): Promise<{
        isPotential: boolean;
        daysLate: number;
        lastPeriodDate?: string;
        expectedPeriodDate?: string;
    }> {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            if (cycles.length === 0) {
                return { isPotential: false, daysLate: 0 };
            }

            // Get the most recent cycle
            const lastCycle = cycles.sort((a, b) => 
                new Date(b.cycle_start_date).getTime() - new Date(a.cycle_start_date).getTime()
            )[0];

            const lastPeriodDate = lastCycle.period_days[lastCycle.period_days.length - 1];
            const expectedPeriodDate = new Date(lastPeriodDate);
            expectedPeriodDate.setDate(expectedPeriodDate.getDate() + (lastCycle.cycle_length || 28));

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expectedPeriodDate.setHours(0, 0, 0, 0);

            const daysLate = Math.floor((today.getTime() - expectedPeriodDate.getTime()) / (1000 * 60 * 60 * 24));

            // Consider potential pregnancy if more than 7 days late
            const isPotential = daysLate > 7;

            console.log('[MenstrualCycleService] Pregnancy detection:', {
                lastPeriodDate: lastPeriodDate.toISOString().split('T')[0],
                expectedPeriodDate: expectedPeriodDate.toISOString().split('T')[0],
                daysLate,
                isPotential
            });

            return {
                isPotential,
                daysLate: Math.max(0, daysLate),
                lastPeriodDate: lastPeriodDate.toISOString(),
                expectedPeriodDate: expectedPeriodDate.toISOString()
            };
            } catch (error) {
            console.error('[MenstrualCycleService] Error detecting pregnancy:', error);
            return { isPotential: false, daysLate: 0 };
        }
    }

    // Smart merge logic for cycles
    private static shouldMergeCycles(
        existingCycle: IMenstrualCycle, 
        newPeriodDays: Date[], 
        newCycleStartDate: Date
    ): boolean {
        const existingStart = new Date(existingCycle.cycle_start_date);
        const existingEnd = existingCycle.predicted_cycle_end || 
            new Date(existingStart.getTime() + (existingCycle.cycle_length || 28) * 24 * 60 * 60 * 1000);
        
        // Check if any of the new period days fall within existing cycle range
        const hasOverlappingDays = newPeriodDays.some(newDate => {
            return newDate >= existingStart && newDate <= existingEnd;
        });
        
        // Check if the new cycle start date is within existing cycle range
        const isWithinExistingCycle = newCycleStartDate >= existingStart && newCycleStartDate <= existingEnd;
        
        // Check if any existing period days are close to new period days (within 3 days for spotting)
        const hasClosePeriodDays = existingCycle.period_days.some(existingPeriodDate => {
            return newPeriodDays.some(newDate => {
                const periodDaysDiff = Math.abs((newDate.getTime() - existingPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
                return periodDaysDiff <= 3; // Reduced from 7 to 3 days
            });
        });
        
        // Check if cycles are too close together (less than minimum cycle length)
        const lastExistingPeriodDay = existingCycle.period_days[existingCycle.period_days.length - 1];
        const daysBetween = Math.abs((newCycleStartDate.getTime() - lastExistingPeriodDay.getTime()) / (1000 * 60 * 60 * 24));
        const isTooClose = daysBetween < CYCLE_CONSTRAINTS.MIN_CYCLE_LENGTH;
        
        console.log('[MenstrualCycleService] Checking overlap for cycle:', existingCycle._id, {
            existingStart: existingStart.toISOString().split('T')[0],
            existingEnd: existingEnd.toISOString().split('T')[0],
            newCycleStart: newCycleStartDate.toISOString().split('T')[0],
            hasOverlappingDays,
            isWithinExistingCycle,
            hasClosePeriodDays,
            isTooClose,
            daysBetween: Math.round(daysBetween)
        });
        
        // Only merge if there's actual overlap or very close proximity
        return hasOverlappingDays || isWithinExistingCycle || hasClosePeriodDays || isTooClose;
    }

    // Group consecutive period days into cycles
    private static groupConsecutivePeriodDays(periodDays: Date[]): Date[][] {
        if (periodDays.length === 0) return [];

        const groups: Date[][] = [];
        let currentGroup: Date[] = [periodDays[0]];

        for (let i = 1; i < periodDays.length; i++) {
            const currentDate = periodDays[i];
            const previousDate = periodDays[i - 1];
            
            // Calculate days difference
            const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // If consecutive or within MAX_DAYS_BETWEEN_PERIODS, add to current group
            if (daysDiff <= CYCLE_CONSTRAINTS.MAX_DAYS_BETWEEN_PERIODS) {
                currentGroup.push(currentDate);
            } else {
                // Start new group
                groups.push([...currentGroup]);
                currentGroup = [currentDate];
            }
        }
        
        // Add the last group
        groups.push(currentGroup);
        
        return groups;
    }

    // Calculate personalized cycle length based on user's history with weighted average
    private static async calculatePersonalizedCycleLength(user_id: string, currentPeriodStart: Date): Promise<number> {
        try {
            // Get user's previous cycles
            const previousCycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (previousCycles.length === 0) {
                return 28; // Default cycle length
            }

            // Sort cycles by start date (most recent first)
            const sortedCycles = previousCycles.sort((a, b) => 
                new Date(b.cycle_start_date).getTime() - new Date(a.cycle_start_date).getTime()
            );

            // Calculate actual cycle lengths from the gaps between cycles
            const actualCycleLengths: number[] = [];
            
            for (let i = 0; i < sortedCycles.length - 1; i++) {
                const currentCycle = sortedCycles[i];
                const nextCycle = sortedCycles[i + 1];
                
                const currentStart = new Date(currentCycle.cycle_start_date);
                const nextStart = new Date(nextCycle.cycle_start_date);
                
                const daysDiff = Math.floor((currentStart.getTime() - nextStart.getTime()) / (1000 * 60 * 60 * 24));
                
                // Only include reasonable cycle lengths (21-45 days)
                if (daysDiff >= CYCLE_CONSTRAINTS.MIN_CYCLE_LENGTH && daysDiff <= CYCLE_CONSTRAINTS.MAX_CYCLE_LENGTH) {
                    actualCycleLengths.push(daysDiff);
                }
            }

            console.log('[MenstrualCycleService] Actual cycle lengths calculated:', {
                totalCycles: sortedCycles.length,
                actualCycleLengths,
                cycleDates: sortedCycles.map(c => c.cycle_start_date.toISOString().split('T')[0])
            });

            // If we have actual cycle lengths, use weighted average
            if (actualCycleLengths.length > 0) {
                const maxCyclesToConsider = Math.min(6, actualCycleLengths.length);
                const weights = [0.3, 0.25, 0.2, 0.15, 0.1, 0.05]; // Weights for up to 6 cycles
                
                let weightedSum = 0;
                let totalWeight = 0;
                
                for (let i = 0; i < maxCyclesToConsider; i++) {
                    weightedSum += actualCycleLengths[i] * weights[i];
                    totalWeight += weights[i];
                }
                
                const weightedAverage = weightedSum / totalWeight;
                
                // Validate the calculated length
                const validatedLength = Math.max(
                    CYCLE_CONSTRAINTS.MIN_CYCLE_LENGTH,
                    Math.min(CYCLE_CONSTRAINTS.MAX_CYCLE_LENGTH, Math.round(weightedAverage))
                );
                
                console.log('[MenstrualCycleService] Calculated cycle length from actual data:', {
                    cyclesConsidered: maxCyclesToConsider,
                    actualCycleLengths: actualCycleLengths.slice(0, maxCyclesToConsider),
                    weightedAverage: Math.round(weightedAverage * 100) / 100,
                    validatedLength
                });
                
                return validatedLength;
            }

            // Fallback: use existing cycle_length values if no actual gaps available
            const maxCyclesToConsider = Math.min(6, sortedCycles.length);
            const weights = [0.3, 0.25, 0.2, 0.15, 0.1, 0.05];
            
            let weightedSum = 0;
            let totalWeight = 0;
            
            for (let i = 0; i < maxCyclesToConsider; i++) {
                const cycle = sortedCycles[i];
                if (cycle.cycle_length) {
                    weightedSum += cycle.cycle_length * weights[i];
                    totalWeight += weights[i];
                }
            }
            
            const weightedAverage = weightedSum / totalWeight;
            
            const validatedLength = Math.max(
                CYCLE_CONSTRAINTS.MIN_CYCLE_LENGTH,
                Math.min(CYCLE_CONSTRAINTS.MAX_CYCLE_LENGTH, Math.round(weightedAverage))
            );
            
            console.log('[MenstrualCycleService] Fallback: using existing cycle_length values:', {
                cyclesConsidered: maxCyclesToConsider,
                weightedAverage: Math.round(weightedAverage * 100) / 100,
                validatedLength,
                cycleLengths: sortedCycles.slice(0, maxCyclesToConsider).map(c => c.cycle_length)
            });
            
            return validatedLength;
        } catch (error) {
            console.error('[MenstrualCycleService] Error calculating cycle length:', error);
            return 28; // Default fallback
        }
    }

    // Prediction methods
    private static predictCycleEnd(startDate: Date, cycleLength: number = 28): Date {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + cycleLength);
        return endDate;
    }

    private static predictOvulationDate(startDate: Date, cycleLength: number = 28): Date {
        const ovulationDate = new Date(startDate);
        ovulationDate.setDate(ovulationDate.getDate() + cycleLength - 14);
        return ovulationDate;
    }

    private static predictFertileStart(startDate: Date, cycleLength: number = 28): Date {
        // Cửa sổ thụ thai bắt đầu từ ngày rụng trứng - 5
        const ovulationDay = cycleLength - 14;
        const fertileStart = new Date(startDate);
        fertileStart.setDate(fertileStart.getDate() + ovulationDay - 5);
        return fertileStart;
    }

    private static predictFertileEnd(startDate: Date, cycleLength: number = 28): Date {
        // Cửa sổ thụ thai kết thúc vào ngày rụng trứng + 1
        const ovulationDay = cycleLength - 14;
        const fertileEnd = new Date(startDate);
        fertileEnd.setDate(fertileEnd.getDate() + ovulationDay + 1);
        return fertileEnd;
    }

    // Get all cycles for a user
    public static async getCycles(user_id: string) {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            const cycleData: CycleData[] = cycles.map(cycle => ({
                _id: cycle._id.toString(),
                user_id: cycle.user_id.toString(),
                cycle_start_date: cycle.cycle_start_date.toISOString(),
                period_days: cycle.period_days.map(date => date.toISOString()),
                cycle_length: cycle.cycle_length,
                predicted_cycle_end: cycle.predicted_cycle_end?.toISOString(),
                predicted_ovulation_date: cycle.predicted_ovulation_date?.toISOString(),
                predicted_fertile_start: cycle.predicted_fertile_start?.toISOString(),
                predicted_fertile_end: cycle.predicted_fertile_end?.toISOString(),
                createdAt: cycle.createdAt.toISOString(),
                updatedAt: cycle.updatedAt.toISOString()
            }));

                return {
                    success: true,
                message: 'Lấy danh sách chu kỳ thành công',
                    data: {
                    cycles: cycleData,
                    total: cycleData.length
                }
            };
        } catch (error) {
            console.error('[MenstrualCycleService] Error getting cycles:', error);
            throw error;
        }
    }

    // Get today's status
    public static async getTodayStatus(user_id: string) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            if (cycles.length === 0) {
                return {
                    success: true,
                    message: 'Không tìm thấy chu kỳ nào',
                    data: {
                        date: today.toISOString(),
                        is_period_day: false,
                        is_fertile_day: false,
                        is_ovulation_day: false,
                        pregnancy_chance: 'low' as const,
                        recommendations: ['Bắt đầu theo dõi chu kỳ kinh nguyệt để nhận thông tin cá nhân hóa'],
                        day_in_cycle: undefined,
                        cycle_phase: 'unknown'
                    }
                };
            }

            // Find current cycle
            const currentCycle = cycles.find(cycle => {
                const cycleStart = new Date(cycle.cycle_start_date);
                const cycleEnd = cycle.predicted_cycle_end || new Date(cycleStart.getTime() + (cycle.cycle_length || 28) * 24 * 60 * 60 * 1000);
                return today >= cycleStart && today <= cycleEnd;
            });

            if (!currentCycle) {
                return {
                    success: true,
                    message: 'Không trong chu kỳ hiện tại',
                    data: {
                        date: today.toISOString(),
                        is_period_day: false,
                        is_fertile_day: false,
                        is_ovulation_day: false,
                        pregnancy_chance: 'low' as const,
                        recommendations: ['Bắt đầu theo dõi chu kỳ kinh nguyệt để nhận thông tin cá nhân hóa'],
                        day_in_cycle: undefined,
                        cycle_phase: 'unknown'
                    }
                };
            }

            // Check if today is a period day
            const isPeriodDay = currentCycle.period_days.some(date => {
                const periodDate = new Date(date);
                periodDate.setHours(0, 0, 0, 0);
                return periodDate.getTime() === today.getTime();
            });

            // Calculate day in cycle
            const cycleStart = new Date(currentCycle.cycle_start_date);
            let dayInCycle = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            
            // If today is a period day, calculate the actual day within the period
            if (isPeriodDay) {
                const periodDayIndex = currentCycle.period_days.findIndex(date => {
                    const periodDate = new Date(date);
                    periodDate.setHours(0, 0, 0, 0);
                    return periodDate.getTime() === today.getTime();
                });
                if (periodDayIndex !== -1) {
                    dayInCycle = periodDayIndex + 1; // 1-based index for display
                }
            }

            // Determine cycle phase
            let cyclePhase = 'unknown';
            let isFertileDay = false;
            let isOvulationDay = false;
            let pregnancyChance: 'low' | 'medium' | 'high' = 'low';

            if (isPeriodDay) {
                // If today is a period day, show menstrual phase
                cyclePhase = 'menstrual';
            } else {
                // Calculate cycle day from cycle start for phase determination
                const cycleDayFromStart = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                // Tính toán dựa trên chu kỳ thực tế thay vì hardcode
                const cycleLength = currentCycle.cycle_length || 28;
                const ovulationDay = cycleLength - 14;
                const fertileStart = ovulationDay - 5;
                const fertileEnd = ovulationDay + 1;
                
                if (cycleDayFromStart <= 5) {
                    cyclePhase = 'menstrual';
                } else if (cycleDayFromStart >= fertileStart && cycleDayFromStart <= fertileEnd) {
                    cyclePhase = 'fertile';
                    isFertileDay = true;
                    pregnancyChance = 'high';
                    if (cycleDayFromStart === ovulationDay) {
                        isOvulationDay = true;
                    }
                } else if (cycleDayFromStart >= fertileEnd + 1 && cycleDayFromStart <= cycleLength - 7) {
                    cyclePhase = 'luteal';
                } else {
                    cyclePhase = 'follicular';
                }
            }

            const recommendations = this.getRecommendations(cyclePhase, isPeriodDay, isFertileDay, isOvulationDay);

            // Calculate PMS window
            const pmsWindow = this.calculatePMSWindow(cycleStart, currentCycle.cycle_length);
            const isPMSDay = today >= pmsWindow.start && today <= pmsWindow.end;

            return { 
                success: true, 
                message: 'Lấy trạng thái hôm nay thành công',
                data: {
                    date: today.toISOString(),
                    is_period_day: isPeriodDay,
                    is_fertile_day: isFertileDay,
                    is_ovulation_day: isOvulationDay,
                    is_pms_day: isPMSDay,
                    pregnancy_chance: pregnancyChance,
                    recommendations,
                    day_in_cycle: dayInCycle,
                    cycle_phase: cyclePhase,
                    predicted_cycle_end: currentCycle.predicted_cycle_end?.toISOString(),
                    predicted_ovulation_date: currentCycle.predicted_ovulation_date?.toISOString(),
                    predicted_fertile_start: currentCycle.predicted_fertile_start?.toISOString(),
                    predicted_fertile_end: currentCycle.predicted_fertile_end?.toISOString(),
                    pms_window_start: pmsWindow.start.toISOString(),
                    pms_window_end: pmsWindow.end.toISOString(),
                    cycle_length: currentCycle.cycle_length,
                    period_length: currentCycle.period_days.length
                }
            };
        } catch (error) {
            console.error('[MenstrualCycleService] Error getting today status:', error);
            throw error;
        }
    }

    // Get cycle statistics
    public static async getCycleStatistics(user_id: string) {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (cycles.length === 0) {
                return {
                    success: true,
                    message: 'Không tìm thấy chu kỳ để thống kê',
                    data: {
                        average_cycle_length: 0,
                        shortest_cycle: 0,
                        longest_cycle: 0,
                        cycle_regularity: 'insufficient_data' as RegularityStatus,
                        trend: 'stable' as TrendStatus,
                        tracking_period_months: 0,
                        total_cycles_tracked: 0,
                        last_6_cycles: []
                    }
                };
            }

            // Sort cycles by start date (oldest first)
            const sortedCycles = cycles.sort((a, b) => 
                new Date(a.cycle_start_date).getTime() - new Date(b.cycle_start_date).getTime()
            );

            // Calculate actual cycle lengths from gaps between cycles
            const actualCycleLengths: number[] = [];
            
            for (let i = 0; i < sortedCycles.length - 1; i++) {
                const currentCycle = sortedCycles[i];
                const nextCycle = sortedCycles[i + 1];
                
                const currentStart = new Date(currentCycle.cycle_start_date);
                const nextStart = new Date(nextCycle.cycle_start_date);
                
                const daysDiff = Math.floor((currentStart.getTime() - nextStart.getTime()) / (1000 * 60 * 60 * 24));
                
                // Only include reasonable cycle lengths (21-45 days)
                if (daysDiff >= CYCLE_CONSTRAINTS.MIN_CYCLE_LENGTH && daysDiff <= CYCLE_CONSTRAINTS.MAX_CYCLE_LENGTH) {
                    actualCycleLengths.push(daysDiff);
                }
            }

            console.log('[MenstrualCycleService] Statistics - Actual cycle lengths:', {
                totalCycles: sortedCycles.length,
                actualCycleLengths,
                cycleDates: sortedCycles.map(c => c.cycle_start_date.toISOString().split('T')[0])
            });

            // Use actual cycle lengths if available, otherwise fallback to stored cycle_length
            const cycleLengths = actualCycleLengths.length > 0 ? actualCycleLengths : 
                sortedCycles.map(cycle => cycle.cycle_length || 28);

            const averageLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
            const shortestCycle = Math.min(...cycleLengths);
            const longestCycle = Math.max(...cycleLengths);

            // Calculate regularity
            const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - averageLength, 2), 0) / cycleLengths.length;
                const standardDeviation = Math.sqrt(variance);
            const regularity: RegularityStatus = standardDeviation <= 3 ? 'regular' : 'irregular';

            // Calculate trend based on actual cycle lengths
            const recentCycleLengths = actualCycleLengths.length > 0 ? 
                actualCycleLengths.slice(-6) : 
                sortedCycles.slice(-6).map(c => c.cycle_length || 28);
            
            const trend: TrendStatus = recentCycleLengths.length < 2 ? 'stable' : 
                recentCycleLengths[recentCycleLengths.length - 1] > recentCycleLengths[0] ? 'lengthening' :
                recentCycleLengths[recentCycleLengths.length - 1] < recentCycleLengths[0] ? 'shortening' : 'stable';

            // Calculate tracking period
            const firstCycle = sortedCycles[0];
            const lastCycle = sortedCycles[sortedCycles.length - 1];
            const trackingPeriodMonths = Math.ceil((lastCycle.createdAt.getTime() - firstCycle.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));

            const last6Cycles = sortedCycles.slice(-6).map(cycle => ({
                start_date: cycle.cycle_start_date.toISOString(),
                length: cycle.cycle_length || 28
            }));
            
            return {
                success: true,
                message: 'Lấy thống kê chu kỳ thành công',
                data: {
                    average_cycle_length: Math.round(averageLength),
                    shortest_cycle: shortestCycle,
                    longest_cycle: longestCycle,
                    cycle_regularity: regularity,
                    trend,
                    tracking_period_months: trackingPeriodMonths,
                    total_cycles_tracked: cycles.length,
                    last_6_cycles: last6Cycles
                }
            };
        } catch (error) {
            console.error('[MenstrualCycleService] Error getting cycle statistics:', error);
            throw error;
        }
    }

    // Get period statistics
    public static async getPeriodStatistics(user_id: string) {
        try {
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            
            if (cycles.length === 0) {
                return {
                    success: true,
                    message: 'Không tìm thấy ngày hành kinh để thống kê',
                    data: {
                        average_period_length: 0,
                        shortest_period: 0,
                        longest_period: 0,
                        period_regularity: 'insufficient_data' as RegularityStatus,
                        total_periods_tracked: 0,
                        last_3_periods: []
                    }
                };
            }

            const periodLengths = cycles.map(cycle => cycle.period_days.length);
            const averageLength = periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length;
            const shortestPeriod = Math.min(...periodLengths);
            const longestPeriod = Math.max(...periodLengths);

            // Calculate regularity
            const variance = periodLengths.reduce((sum, length) => sum + Math.pow(length - averageLength, 2), 0) / periodLengths.length;
                const standardDeviation = Math.sqrt(variance);
            const regularity: RegularityStatus = standardDeviation <= 1 ? 'regular' : 'irregular';

            const last3Periods = cycles.slice(-3).map(cycle => ({
                start_date: cycle.cycle_start_date.toISOString(),
                length: cycle.period_days.length
            }));

            return {
                success: true,
                message: 'Lấy thống kê ngày hành kinh thành công',
                data: {
                    average_period_length: Math.round(averageLength),
                    shortest_period: shortestPeriod,
                    longest_period: longestPeriod,
                    period_regularity: regularity,
                    total_periods_tracked: cycles.length,
                    last_3_periods: last3Periods
                }
            };
        } catch (error) {
            console.error('[MenstrualCycleService] Error getting period statistics:', error);
            throw error;
        }
    }

    // Delete a specific period day and recalculate cycle
    public static async deletePeriodDay(user_id: string, dateToDelete: string) {
        try {
            console.log('[MenstrualCycleService] deletePeriodDay called with:', { user_id, dateToDelete });
            
            const cycles = await MenstrualCycleRepository.findByUser(user_id);
            if (cycles.length === 0) {
                return {
                    success: false,
                    message: 'Không tìm thấy chu kỳ nào'
                };
            }

            // Find the cycle containing the period day to delete
            let targetCycle: any = null;
            let dayIndex: number = -1;
            
            for (const cycle of cycles) {
                const index = cycle.period_days.findIndex(date => {
                    const cycleDate = new Date(date);
                    const deleteDate = new Date(dateToDelete);
                    return cycleDate.toISOString().split('T')[0] === deleteDate.toISOString().split('T')[0];
                });
                
                if (index !== -1) {
                    targetCycle = cycle;
                    dayIndex = index;
                                    break;
                            }
            }

            if (!targetCycle || dayIndex === -1) {
            return {
                success: false,
                    message: 'Không tìm thấy ngày hành kinh cần xóa'
                };
            }

            console.log('[MenstrualCycleService] Found cycle to update:', {
                cycleId: targetCycle._id,
                originalPeriodDays: targetCycle.period_days.length,
                dayToDelete: dateToDelete
            });

            // Remove the specific day
            const updatedPeriodDays = targetCycle.period_days.filter((date: Date, index: number) => index !== dayIndex);
            
            // If no period days left, delete the entire cycle
            if (updatedPeriodDays.length === 0) {
                await MenstrualCycle.findByIdAndDelete(targetCycle._id);
                console.log('[MenstrualCycleService] Deleted entire cycle as no period days left');
                
            return {
                    success: true,
                    message: 'Đã xóa ngày hành kinh và chu kỳ',
                    data: {
                        deleted_date: dateToDelete,
                        cycle_deleted: true
                    }
                };
            }

            // Recalculate cycle properties
            const cycleStartDate = updatedPeriodDays[0];
            const cycleLength = await this.calculatePersonalizedCycleLength(user_id, cycleStartDate);
            
            const updatedCycleData = {
                period_days: updatedPeriodDays,
                cycle_length: cycleLength,
                predicted_cycle_end: this.predictCycleEnd(cycleStartDate, cycleLength),
                predicted_ovulation_date: this.predictOvulationDate(cycleStartDate, cycleLength),
                predicted_fertile_start: this.predictFertileStart(cycleStartDate, cycleLength),
                predicted_fertile_end: this.predictFertileEnd(cycleStartDate, cycleLength)
            };

            // Update the cycle
            await MenstrualCycleRepository.updateCycle(targetCycle._id, updatedCycleData);
            
            console.log('[MenstrualCycleService] Successfully updated cycle:', {
                cycleId: targetCycle._id,
                newPeriodDaysCount: updatedPeriodDays.length,
                newCycleLength: cycleLength
            });

                return {
                    success: true,
                message: 'Đã xóa ngày hành kinh thành công',
                    data: {
                    deleted_date: dateToDelete,
                    cycle_id: targetCycle._id,
                    remaining_period_days: updatedPeriodDays.length,
                    updated_cycle_length: cycleLength
                }
            };

        } catch (error) {
            console.error('[MenstrualCycleService] Error deleting period day:', error);
            throw error;
        }
    }

    // Delete a specific cycle
    public static async deleteCycle(user_id: string, cycleId: string) {
        try {
            console.log('[MenstrualCycleService] deleteCycle called with:', { user_id, cycleId });
            
            // Find the cycle and verify ownership
            const cycle = await MenstrualCycle.findById(cycleId);
            if (!cycle) {
                throw new Error('Không tìm thấy chu kỳ');
            }
            
            if (cycle.user_id.toString() !== user_id) {
                throw new Error('Không có quyền xóa chu kỳ này');
            }
            
            // Delete the cycle
            await MenstrualCycle.findByIdAndDelete(cycleId);

            return {
                success: true,
                message: 'Đã xóa chu kỳ thành công'
            };
            
        } catch (error) {
            console.error('[MenstrualCycleService] Error deleting cycle:', error);
            throw error;
        }
    }

    // Get recommendations based on cycle phase
    private static getRecommendations(cyclePhase: string, isPeriodDay: boolean, isFertileDay: boolean, isOvulationDay: boolean): string[] {
        const recommendations: string[] = [];
        
        if (isPeriodDay) {
            recommendations.push(
                'Nghỉ ngơi và chăm sóc bản thân trong thời kỳ kinh nguyệt',
                'Uống đủ nước và duy trì chế độ ăn uống lành mạnh',
                'Cân nhắc sử dụng ứng dụng theo dõi chu kỳ để có thông tin chi tiết hơn'
            );
        } else if (isFertileDay) {
            recommendations.push(
                'Đây là thời kỳ thụ thai - hãy lên kế hoạch phù hợp',
                'Duy trì lối sống lành mạnh để hỗ trợ khả năng sinh sản',
                'Cân nhắc theo dõi nhiệt độ cơ thể cơ bản để có thông tin chi tiết hơn'
            );
        } else if (isOvulationDay) {
            recommendations.push(
                'Hôm nay có thể là ngày rụng trứng của bạn',
                'Đây là đỉnh điểm của thời kỳ thụ thai',
                'Cân nhắc theo dõi chất nhầy cổ tử cung để nhận biết khả năng sinh sản'
            );
        } else {
        switch (cyclePhase) {
                case 'follicular':
                    recommendations.push(
                        'Mức năng lượng thường cao trong giai đoạn này',
                        'Thời điểm tốt cho các dự án mới và hoạt động xã hội',
                        'Tập trung vào việc xây dựng sức mạnh và sức bền'
                    );
                break;
                case 'luteal':
                    recommendations.push(
                        'Chú ý đến những thay đổi tâm trạng trong giai đoạn này',
                        'Tập trung vào việc chăm sóc bản thân và quản lý căng thẳng',
                        'Cân nhắc tập thể dục nhẹ nhàng và kỹ thuật thư giãn'
                    );
                break;
                default:
                    recommendations.push(
                        'Tiếp tục theo dõi chu kỳ để có thông tin cá nhân hóa',
                        'Duy trì lối sống lành mạnh trong suốt chu kỳ'
                    );
            }
        }

        return recommendations;
    }
}
