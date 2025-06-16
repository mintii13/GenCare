import mongoose, {Model} from 'mongoose';

export class GenericRepository {
    public static async findByTargetId<T = any>(id: string | mongoose.Types.ObjectId): Promise<T | null> {
        try {
            if (!id) 
                return null;
            return await Model.findById(id).lean<T>();
        } catch (error) {
            console.error(`Error finding by id:`, error);
            throw error;
        }
    }
}