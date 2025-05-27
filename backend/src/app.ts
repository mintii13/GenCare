import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './configs/database';
import authController from './controllers/authController';
import { errorHandler } from './middlewares/errorHandler';
import session from 'express-session';
import googleController from './controllers/googleController';
import passport from './configs/passport';
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/api/auth', authController);

// // Error handling middleware
// app.use(errorHandler);

// // Connect to database and start server
// connectDatabase();

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(googleController);

app.listen(PORT, () => {
  console.log(`Run successfully through http://localhost:${PORT}`);
})


export default app;