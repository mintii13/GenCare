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
import weeklyScheduleController from './controllers/weeklyScheduleController';
import appointmentController from './controllers/appointmentController';
import profileController from './controllers/profileController';
import stiController from './controllers/stiController';

const app = express();
const PORT = process.env.PORT;

// Security middleware
app.use(helmet());

// CORS cấu hình cho phép frontend truy cập với credentials
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Thêm middleware thủ công để set header CORS cho mọi response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

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

// Routes
app.use('/api/auth', authController);
app.use('/api/blogs', blogController);
app.use('/api/weekly-schedule', weeklyScheduleController);
app.use('/api/appointments', appointmentController);
app.use('/api/profile', profileController);
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