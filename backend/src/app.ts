import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './configs/database';
import authController from './controllers/authController';
import { errorHandler } from './middlewares/errorHandler';
import session from 'express-session';
import passport from './configs/passport';
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS cấu hình cho phép frontend truy cập với credentials
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// google
// app.get("/", (req, res) => {
//   res.send("<a href='/api/auth/google/verify'>Login with google</a>")        //nơi truyền frontend để input (FRONTEND), bỏ khi gắn vào frontend
// })

//myapp
app.get('/', (req, res) => {
    res.send("<a href='/api/auth/registerForm'>Sign up by system</a>")
})

app.use('/api/auth', authController);

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDatabase();
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