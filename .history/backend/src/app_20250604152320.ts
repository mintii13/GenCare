import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './configs/database';
import authController from './controllers/authController';
import { errorHandler } from './middlewares/errorHandler';
import session from 'express-session';
import passport from './configs/passport';
import { startRedisServer } from './configs/redis';
import redisClient from './configs/redis';
require('dotenv').config();
import blogController from './controllers/blogController';

const app = express();
const PORT = process.env.PORT || 3000;


// Security middleware
app.use(helmet());

// CORS cấu hình cho phép frontend truy cập với credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authController);
app.use('/api/blogs', blogController);

// Error handling middleware
app.use(errorHandler);


const startServer = async () => {
  try {
    // 1. On the redisServer
    const redisProcess = await startRedisServer();

    // 2. Connect to RedisClient
    await redisClient.connect();
    console.log('Connected to Redis!');

    // 3. Connect Database
    await connectDatabase();

    // 4. Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    process.on('exit', () => {
      redisProcess.kill();
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;