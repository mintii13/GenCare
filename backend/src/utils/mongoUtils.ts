import mongoose from 'mongoose';

export class MongoUtils {
    /**
     * Convert string to ObjectId
     */
    static toObjectId(id: string): mongoose.Types.ObjectId {
        return new mongoose.Types.ObjectId(id);
    }

    /**
     * Validate if string is a valid ObjectId
     */
    static isValidObjectId(id: string): boolean {
        return mongoose.Types.ObjectId.isValid(id);
    }

    /**
     * Convert ObjectId to string
     */
    static toString(id: mongoose.Types.ObjectId): string {
        return id.toString();
    }
}