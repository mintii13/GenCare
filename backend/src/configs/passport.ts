//nơi xử lý thông tin liên quan đến google
import passport from 'passport';
import express from 'express';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
require('dotenv').config();
const PORT = process.env.PORT || 3000;

passport.use( 
    new GoogleStrategy( {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: `http://localhost:${PORT}/auth/google/callback`
    },
    (accessToken, refreshToken, profile, done) => {      //nếu không có gọi API của calendar thì ko cần accessToken và refreshToken
    // (_, __, profile, done) => {                         nhưng vẫn phải nhập do GoogleStategy yêu cầu đủ parameters.
      return done(null, profile);
    })
)

//lưu dữ liệu người dùng bên trong phiên
passport.serializeUser((user: Express.User, done) => {
    done(null, user);
});
//lấy data của user khi cần thiết
passport.deserializeUser((user: Express.User, done) => {
    done(null, user)
});

export default passport