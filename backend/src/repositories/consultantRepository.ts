import { Consultant, IConsultant, SpecializationType } from '../models/Consultant';
import mongoose from 'mongoose';
interface ConsultantWithUser {
    consultant_id: string;
    user_id: string;
    full_name: string;
    email: string;
    specialization: SpecializationType;
    qualifications: string;
    experience_years: number;
    consultation_rating?: number;
    total_consultations: number;
}

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

    public static async updateByUserId(userId: string, updateData: Partial<IConsultant>) {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            console.log('Updating consultant where user_id =', userObjectId);
            console.log('Update data:', updateData);

            const result = await Consultant.findOneAndUpdate(
                { user_id: userObjectId },
                updateData,
                { new: true, runValidators: true }
            );

            if (!result) {
                console.warn('No consultant found to update.');
            }

            return result;
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

    public static async getBySpecialization(specialization: SpecializationType): Promise<ConsultantWithUser[]> {
        try {
            const consultants = await Consultant.find({ specialization })
                .populate('user_id', 'full_name email')
                .lean();

            return consultants.map(c => {
                const user = c.user_id as unknown as { _id: string; full_name: string; email: string };

                return {
                    consultant_id: c._id.toString(),
                    user_id: user._id,
                    full_name: user.full_name,
                    email: user.email,
                    specialization: c.specialization,
                    qualifications: c.qualifications,
                    experience_years: c.experience_years,
                    consultation_rating: c.consultation_rating,
                    total_consultations: c.total_consultations,
                };
            });
        } catch (error) {
            console.error('Error finding consultants by specialization:', error);
            throw error;
        }
    }

    public static async findConsultantsByIdAndSpecialization(
        consultantId: string,
        specialization: SpecializationType
    ): Promise<IConsultant | null> {
        try {
            return await Consultant.findOne({
                _id: new mongoose.Types.ObjectId(consultantId),
                specialization: specialization
            });
        } catch (error) {
            console.error('Error finding consultant by ID and specialization:', error);
            throw error;
        }
    }
}