// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './configs/database';
import authController from './controllers/authController';
import { errorHandler } from './middlewares/errorHandler';
import session from 'express-session';
import passport from './configs/passport';
import redisClient from './configs/redis';
import blogController from './controllers/blogController';
import weeklyScheduleController from './controllers/weeklyScheduleController';
import appointmentController from './controllers/appointmentController';
import consultantController from './controllers/consultantController';
import staffController from './controllers/staffController';
import profileController from './controllers/profileController';
import stiController from './controllers/stiController';
import { ReminderSchedulerService } from './services/reminderSchedulerService';
import menstrualCycleController from './controllers/menstrualCycleController';
import pillTrackingController from './controllers/pillTrackingController'
import { PillTrackingReminderService } from './services/pillTrackingService';
import appointmentHistoryController from './controllers/appointmentHistoryController';
import stiAssessmentRoutes from './controllers/stiAssessmentController';
import userController from './controllers/userController';
import homeController from './controllers/homeController';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS cấu hình cho phép frontend truy cập với credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Thêm middleware thủ công để set header CORS cho mọi response
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
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
    secret: process.env.SESSION_SECRET ?? 'your-secret-key',
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
app.use('/api/appointment-history', appointmentHistoryController);
app.use('/api/consultants', consultantController);
app.use('/api/staff', staffController);
app.use('/api/profile', profileController);
app.use('/api/users', userController);
app.use('/api/sti', stiController);
app.use('/api/menstrual-cycle', menstrualCycleController);
app.use('/api/pill-tracking', pillTrackingController);
app.use('/api/sti-assessment', stiAssessmentRoutes);
app.use('/api/home', homeController);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: 'Connected',
      redis: redisClient.isOpen ? 'Connected' : 'Disconnected',
      reminderScheduler: ReminderSchedulerService.getStatus().isRunning ? 'Running' : 'Stopped'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

const startServer = async () => {
  try {
      console.log(' Starting GenCare Backend Server...');

    // 1. Connect to RedisClient
    console.log(' Connecting to Redis...');
    await redisClient.connect();
    console.log(' Connected to Redis!');

    // 2. Connect Database
    console.log('Connecting to MongoDB...');
    await connectDatabase();
    console.log(' Connected to MongoDB!');

    // 3. Start Express server
    console.log(` Starting Express server on port ${PORT}...`);
    app.listen(PORT, () => {
      console.log(` Server is running on http://localhost:${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
    });

    // 4. Start reminder scheduler
    console.log(' Starting reminder scheduler...');
    ReminderSchedulerService.startScheduler();
    console.log(' Reminder scheduler started!');
    PillTrackingReminderService.startPillReminder();
    console.log(' Pill reminder scheduler started!');

    console.log(' All services started successfully!');
    console.log(' Available services:');
    console.log('   - Authentication: /api/auth');
    console.log('   - Appointments: /api/appointments');
    console.log('   - Blogs: /api/blogs');
    console.log('   - Consultants: /api/consultants');
    console.log('   - STI Services: /api/sti');
    console.log('   - Weekly Schedule: /api/weekly-schedule');
    console.log('   - Profile: /api/profile');
    console.log('   - Health Check: /health');

  } catch (error) {
    console.error(' Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n Received SIGINT, shutting down gracefully...');

  try {
    // Stop reminder scheduler
    ReminderSchedulerService.stopScheduler();
    console.log(' Reminder scheduler stopped');

    PillTrackingReminderService.stopPillReminder();
    console.log(' Pill reminder scheduler stopped');
    // Close Redis connection
    await redisClient.quit();
    console.log(' Redis connection closed');

    console.log(' Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error(' Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n Received SIGTERM, shutting down gracefully...');

  try {
    ReminderSchedulerService.stopScheduler();
    await redisClient.quit();
    console.log(' Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error(' Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();

export default app;