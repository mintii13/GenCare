import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './configs/database';
import authController from './controllers/authController';
import { errorHandler } from './middlewares/errorHandler';
import session from 'express-session';
import passport from './configs/passport';
import redisClient from './configs/redis';
require('dotenv').config();
import blogController from './controllers/blogController';

import stiController from './controllers/stiController';
const app = express();
const PORT = process.env.PORT;


// Security middleware
app.use(helmet());

// CORS cấu hình cho phép frontend truy cập với credentials
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authController);
app.use('/api/blogs', blogController);

app.use('/api/sti', stiController);

// Error handling middleware
app.use(errorHandler);


const startServer = async () => {
  try {
    // 1. Connect to RedisClient
    await redisClient.connect();
    console.log('Connected to Redis!');

    // 2. Connect Database
    await connectDatabase();

    // 3. Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;