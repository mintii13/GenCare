//nơi xử lý thông tin liên quan đến google
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService } from '../services/authService';
import * as dotenv from 'dotenv';
import { UserRepository } from '../repositories/userRepository';

// Load environment variables
dotenv.config();

// Validate Google OAuth environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Google OAuth configuration is incomplete. Please check your .env file.');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const user = await AuthService.insertGoogle(profile);
        // Đảm bảo user object có đầy đủ properties cần thiết
        const userForSession = {
          _id: user._id,
          id: user._id, // Backup property
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken
        };
        return done(null, userForSession);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);



//get data from user
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await UserRepository.findById(id);
    if (!user) {
      return done(new Error('User not found'));
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;