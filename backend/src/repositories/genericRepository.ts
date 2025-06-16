import mongoose, {Model} from 'mongoose';

export class GenericRepository {
    public static async findByTargetId<T = any>(model: mongoose.Model<any>, id: string | mongoose.Types.ObjectId): Promise<T | null> {
        try {
            if (!id) 
                return null;
            return await model.findById(id).lean<T>();
        } catch (error) {
            console.error(`Error finding by id:`, error);
            throw error;
        }
    }
}