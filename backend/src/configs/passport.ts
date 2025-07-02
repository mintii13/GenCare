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
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('Google OAuth callback - Profile:', profile.emails[0]?.value);
        const user = await AuthService.insertGoogle(profile);
        console.log('User processed successfully:', user.email);

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

        console.log('User object for session:', userForSession);
        return done(null, userForSession);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

//lưu dữ liệu người dùng bên trong phiên
passport.serializeUser((user: any, done: any) => {
  try {
    console.log('Serializing user:', user);
    // Handle cả trường hợp user là mongoose document và plain object
    const userId = user._id || user.id;
    if (!userId) {
      console.error('No user ID found for serialization');
      return done(new Error('No user ID found'));
    }
    done(null, userId.toString());
  } catch (error) {
    console.error('Serialize user error:', error);
    done(error);
  }
});

//lấy data của user khi cần thiết
passport.deserializeUser(async (id: string, done: any) => {
  try {
    console.log('Deserializing user ID:', id);
    const user = await User.findById(id);
    if (!user) {
      console.error('User not found during deserialization');
      return done(new Error('User not found'));
    }
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

export default passport;