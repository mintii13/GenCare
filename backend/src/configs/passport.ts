//nơi xử lý thông tin liên quan đến google
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';
import { AuthService } from '../services/authService';
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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