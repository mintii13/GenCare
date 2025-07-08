import { Consultant, IConsultant } from '../models/Consultant';
import mongoose from 'mongoose';

export class ConsultantRepository {
    public static async create(consultantData: Partial<IConsultant>): Promise<IConsultant> {
        try {
            const consultant = new Consultant(consultantData);
            return await consultant.save();
        } catch (error) {
            console.error('Error creating consultant:', error);
            throw error;
        }
    }

    public static async findByUserId(userId: string): Promise<IConsultant | null> {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            return await Consultant.findOne({ user_id: userObjectId });
        } catch (error) {
            console.error('Error finding consultant by user ID:', error);
            throw error;
        }
    }

    public static async findById(consultantId: string): Promise<IConsultant | null> {
        try {
            return await Consultant.findById(consultantId);
        } catch (error) {
            console.error('Error finding consultant by ID:', error);
            throw error;
        }
    }

    public static async updateByUserId(userId: string, updateData: Partial<IConsultant>): Promise<IConsultant | null> {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            return await Consultant.findOneAndUpdate(
                { user_id: userObjectId },
                updateData,
                { new: true, runValidators: true }
            );
        } catch (error) {
            console.error('Error updating consultant:', error);
            throw error;
        }
    }

    public static async deleteByUserId(userId: string): Promise<boolean> {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const result = await Consultant.findOneAndDelete({ user_id: userObjectId });
            return !!result;
        } catch (error) {
            console.error('Error deleting consultant:', error);
            throw error;
        }
    }
}