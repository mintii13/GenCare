import { ObjectId } from 'mongoose';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose'

export class UserRepository {
    public static async findById(user_id: string): Promise<IUser | null> {
        try {
            const userId = new mongoose.Types.ObjectId(user_id);
            return await User.findById(userId);
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    public static async findByEmail(email: string): Promise<IUser | null> {
        try {
            return await User.findOne({ email });
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }
    
    public static async getUserRoleById(userId: string): Promise<string | null> {
        const user = await User.findById(new mongoose.Types.ObjectId(userId));
        return user ? user.role : null;
    }

    public static async findByIdAndUpdate(userId: ObjectId, updateData: Partial<IUser>): Promise<IUser | null> {
        try {
            return await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    public static async updateLastLogin(userId: string): Promise<void> {
        try {
            await User.updateOne(
                { _id: userId },
                { last_login: new Date() }
            );
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    }

    public static async insertUser(user: Partial<IUser>){
        try {
            return await User.create(user);
        } catch (error) {
            console.error('Error insert user:', error);
            throw error;
        }  
    }

    public static async saveUser(user: IUser){
        try {
            return await user.save();
        } catch (error) {
            console.error('Error insert user:', error);
            throw error;
        }
    }
    
}