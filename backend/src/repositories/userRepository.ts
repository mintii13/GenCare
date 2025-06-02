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

    public static async insertGoogle(profile: any): Promise<Express.User>{
        const email = profile.emails[0]?.value || null;
        const full_name = profile.name.givenName  + " " + profile.name.familyName;
        const registration_date = new Date();
        const updated_date = new Date();
        const status = true;
        const email_verified = true;
        const role = 'customer';
        const googleId = profile.id;

        let user = await User.findOne({googleId});
        if (!user){
            user = await User.create({email, full_name, registration_date, updated_date, status, email_verified, role, googleId})
        }
        return user;
    }

    public static async insertMyApp(user: {
        email: string;
        password?: string;
        full_name: string;
        phone?: string;
        date_of_birth?: Date;
        gender?: string;
        registration_date: Date;
        updated_date: Date;
        last_login?: Date;
        status: boolean;
        email_verified: boolean;
        role: 'customer' | 'consultant' | 'staff' | 'admin';
        googleId?: string;
    }) {
        const newUser = new User(user);
        return await newUser.save();
    }
}