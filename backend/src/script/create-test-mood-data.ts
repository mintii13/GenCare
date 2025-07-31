import mongoose from 'mongoose';
import { connectDatabase } from '../configs/database';
import { MenstrualCycle } from '../models/MenstrualCycle';

/**
 * Script to create test mood data for testing the new mood data feature
 */

async function createTestMoodData() {
    try {
        // Connect to database
        await connectDatabase();
        console.log('Connected to MongoDB');

        // Find existing cycles to add mood data to
        const existingCycles = await MenstrualCycle.find({}).limit(5);
        
        if (existingCycles.length === 0) {
            console.log('No existing cycles found. Creating test cycles first...');
            
            // Create test cycles if none exist
            const testCycles = [
                {
                    user_id: 'test-user-1',
                    cycle_start_date: new Date('2024-01-01'),
                    cycle_length: 28,
                    period_days: [1, 2, 3, 4, 5],
                    mood_data: {
                        '2024-01-01': {
                            mood: 'happy',
                            energy: 'high',
                            symptoms: ['Đau bụng', 'Mệt mỏi'],
                            notes: 'Ngày đầu tiên của chu kỳ, cảm thấy khá tốt'
                        },
                        '2024-01-02': {
                            mood: 'tired',
                            energy: 'low',
                            symptoms: ['Đau lưng', 'Chuột rút'],
                            notes: 'Cảm thấy mệt mỏi hơn, cần nghỉ ngơi nhiều'
                        },
                        '2024-01-03': {
                            mood: 'calm',
                            energy: 'medium',
                            symptoms: ['Đau đầu'],
                            notes: 'Tâm trạng ổn định hơn'
                        }
                    }
                },
                {
                    user_id: 'test-user-2',
                    cycle_start_date: new Date('2024-01-15'),
                    cycle_length: 30,
                    period_days: [1, 2, 3, 4, 5, 6],
                    mood_data: {
                        '2024-01-15': {
                            mood: 'stressed',
                            energy: 'low',
                            symptoms: ['Đau bụng', 'Buồn nôn'],
                            notes: 'Ngày đầu tiên, cảm thấy căng thẳng'
                        },
                        '2024-01-16': {
                            mood: 'sad',
                            energy: 'low',
                            symptoms: ['Mệt mỏi', 'Chóng mặt'],
                            notes: 'Tâm trạng không tốt, cần chăm sóc bản thân'
                        },
                        '2024-01-17': {
                            mood: 'calm',
                            energy: 'medium',
                            symptoms: [],
                            notes: 'Cảm thấy tốt hơn'
                        },
                        '2024-01-18': {
                            mood: 'happy',
                            energy: 'high',
                            symptoms: [],
                            notes: 'Tâm trạng rất tốt, năng lượng cao'
                        }
                    }
                }
            ];

            await MenstrualCycle.insertMany(testCycles);
            console.log('Created test cycles with mood data');
        } else {
            console.log(`Found ${existingCycles.length} existing cycles. Adding mood data...`);
            
            // Add mood data to existing cycles
            for (const cycle of existingCycles) {
                const cycleStartDate = cycle.cycle_start_date;
                const moodData: any = {};
                
                // Generate mood data for 5 days starting from cycle start
                for (let i = 0; i < 5; i++) {
                    const date = new Date(cycleStartDate);
                    date.setDate(date.getDate() + i);
                    const dateString = date.toISOString().split('T')[0];
                    
                    const moods = ['happy', 'calm', 'tired', 'stressed', 'sad', 'excited'];
                    const energies = ['high', 'medium', 'low'];
                    const symptoms = [
                        'Đau bụng', 'Đau lưng', 'Đau đầu', 'Mệt mỏi', 
                        'Chuột rút', 'Đầy hơi', 'Buồn nôn', 'Chóng mặt'
                    ];
                    
                    moodData[dateString] = {
                        mood: moods[Math.floor(Math.random() * moods.length)],
                        energy: energies[Math.floor(Math.random() * energies.length)],
                        symptoms: symptoms.slice(0, Math.floor(Math.random() * 3) + 1),
                        notes: `Ghi chú cho ngày ${dateString} - ${Math.random() > 0.5 ? 'Cảm thấy khá tốt' : 'Cần chăm sóc bản thân'}`
                    };
                }
                
                // Update cycle with mood data
                await MenstrualCycle.updateOne(
                    { _id: cycle._id },
                    { $set: { mood_data: moodData } }
                );
                
                console.log(`Added mood data to cycle ${cycle._id}`);
            }
        }

        // Verify the data
        const cyclesWithMoodData = await MenstrualCycle.find({
            mood_data: { $exists: true, $ne: {} }
        });

        console.log('\n Test data creation completed!');
        console.log(`- Total cycles with mood data: ${cyclesWithMoodData.length}`);
        
        // Show sample data
        if (cyclesWithMoodData.length > 0) {
            const sampleCycle = cyclesWithMoodData[0];
            console.log('\n📊 Sample mood data:');
            console.log(`- User ID: ${sampleCycle.user_id}`);
            console.log(`- Cycle start: ${sampleCycle.cycle_start_date}`);
            console.log(`- Mood data entries: ${Object.keys(sampleCycle.mood_data || {}).length}`);
            
            const firstDate = Object.keys(sampleCycle.mood_data || {})[0];
            if (firstDate) {
                const firstEntry = sampleCycle.mood_data[firstDate];
                console.log(`- Sample entry for ${firstDate}:`);
                console.log(`  - Mood: ${firstEntry.mood}`);
                console.log(`  - Energy: ${firstEntry.energy}`);
                console.log(`  - Symptoms: ${firstEntry.symptoms.join(', ')}`);
                console.log(`  - Notes: ${firstEntry.notes}`);
            }
        }

    } catch (error) {
        console.error('Failed to create test mood data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run script if executed directly
if (require.main === module) {
    createTestMoodData()
        .then(() => {
            console.log('Test data creation script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Test data creation script failed:', error);
            process.exit(1);
        });
}

export { createTestMoodData }; 