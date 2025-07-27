import mongoose from 'mongoose';
import { MenstrualCycle } from '../models/MenstrualCycle';
import { connectDatabase } from '../configs/database';

/**
 * Migration script to convert notes field to mood_data field
 * This script will:
 * 1. Find all menstrual cycles with notes
 * 2. Convert notes to mood_data format
 * 3. Update the documents
 * 4. Remove the old notes field
 */

async function migrateNotesToMoodData() {
    try {
        // Connect to database
        await connectDatabase();
        console.log('Connected to MongoDB');

        // Find all documents with notes field
        const cyclesWithNotes = await MenstrualCycle.find({
            notes: { $exists: true, $ne: null }
        });

        console.log(`Found ${cyclesWithNotes.length} cycles with notes to migrate`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const cycle of cyclesWithNotes) {
            try {
                // Skip if already has mood_data
                if (cycle.mood_data && Object.keys(cycle.mood_data).length > 0) {
                    console.log(`Skipping cycle ${cycle._id} - already has mood_data`);
                    skippedCount++;
                    continue;
                }

                // Convert notes to mood_data format
                const moodData = {
                    [cycle.cycle_start_date.toISOString().split('T')[0]]: {
                        mood: '',
                        energy: '',
                        symptoms: [],
                        notes: (cycle as any).notes || '' // Preserve original notes in the notes field
                    }
                };

                // Update the document
                await MenstrualCycle.updateOne(
                    { _id: cycle._id },
                    { 
                        $set: { mood_data: moodData },
                        $unset: { notes: 1 } // Remove the old notes field
                    }
                );

                console.log(`Migrated cycle ${cycle._id}`);
                migratedCount++;

            } catch (error) {
                console.error(`Error migrating cycle ${cycle._id}:`, error);
            }
        }

        console.log('\nMigration completed!');
        console.log(`- Migrated: ${migratedCount} cycles`);
        console.log(`- Skipped: ${skippedCount} cycles (already had mood_data)`);

        // Verify migration
        const cyclesWithOldNotes = await MenstrualCycle.find({
            notes: { $exists: true }
        });

        if (cyclesWithOldNotes.length > 0) {
            console.log(`Warning: ${cyclesWithOldNotes.length} cycles still have notes field`);
        } else {
            console.log('✅ All notes fields have been successfully removed');
        }

        const cyclesWithMoodData = await MenstrualCycle.find({
            mood_data: { $exists: true, $ne: {} }
        });

        console.log(`✅ ${cyclesWithMoodData.length} cycles now have mood_data`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateNotesToMoodData()
        .then(() => {
            console.log('Migration script completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

export { migrateNotesToMoodData }; 