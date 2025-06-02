import { User, IUser } from '../models/User';

export class UserRepository {
    public static async findByEmail(email: string): Promise<IUser | null> {
        try {
            return await User.findOne({ email }).lean<IUser>();
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

    public static async insertUser(user: Partial<IUser>)
    {
        try {
            return await User.create(user);
        } catch (error) {
            console.error('Error insert user:', error);
            throw error;
        }  
    }
    
}