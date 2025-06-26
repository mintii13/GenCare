//nơi xử lý thông tin liên quan đến google
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import { AuthService } from '../services/authService';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate Google OAuth environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing Google OAuth configuration:');
  console.error('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
  console.error('GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
  throw new Error('Google OAuth configuration is incomplete. Please check your .env file.');
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken: string, _unused: any, profile: any, done: any) => {
      const user = await AuthService.insertGoogle(profile);
      return done(null, user);
    }
  )
);

//lưu dữ liệu người dùng bên trong phiên
passport.serializeUser((user: any, done: any) => {
  done(null, user._id);
});
//lấy data của user khi cần thiết
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport