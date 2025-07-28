import { connectDatabase } from '../configs/database';
import { MenstrualCycle } from '../models/MenstrualCycle';
import mongoose from 'mongoose';

async function testCycleSave() {
    try {
        await connectDatabase();
        console.log('Connected to database');

        // Test data
        const testCycleData = {
            user_id: new mongoose.Types.ObjectId('68655fd9499c7a6bbcf0c511'),
            cycle_start_date: new Date('2025-07-01'),
            period_days: [
                {
                    date: new Date('2025-07-01'),
                    mood_data: {
                        mood: 'neutral',
                        energy: 'medium',
                        symptoms: [],
                        notes: undefined
                    }
                },
                {
                    date: new Date('2025-07-02'),
                    mood_data: {
                        mood: 'happy',
                        energy: 'high',
                        symptoms: [],
                        notes: undefined
                    }
                }
            ],
            cycle_length: 7,
            predicted_cycle_end: new Date('2025-07-29'),
            predicted_ovulation_date: new Date('2025-07-15'),
            predicted_fertile_start: new Date('2025-07-11'),
            predicted_fertile_end: new Date('2025-07-18')
        };

        console.log('Test data:', JSON.stringify(testCycleData, null, 2));

        // Try to save
        const cycle = new MenstrualCycle(testCycleData);
        const savedCycle = await cycle.save();
        
        console.log('Successfully saved cycle:', savedCycle._id);
        console.log('Saved data:', JSON.stringify(savedCycle, null, 2));

        // Check if it's in database
        const foundCycle = await MenstrualCycle.findById(savedCycle._id);
        console.log('Found cycle in database:', foundCycle ? 'YES' : 'NO');

        // Count total cycles for this user
        const totalCycles = await MenstrualCycle.countDocuments({ user_id: testCycleData.user_id });
        console.log('Total cycles for user:', totalCycles);

    } catch (error) {
        console.error('Error in test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
}

testCycleSave(); 