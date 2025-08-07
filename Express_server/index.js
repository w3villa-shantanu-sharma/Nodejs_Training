import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './config/passport.js';
import './utils/expirePlans.js';
import './utils/clean-jobs.js';

import userRouter from './routes/userRoutes.js';
import googleAuthRoutes from './routes/googleAuthRoutes.js';
import podcastRouter from './routes/podcast.js';
import paymentRouter from './routes/payment.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

import youtubeRoutes from './routes/youtubeRoutes.js';


dotenv.config({ path: './.env' });

const app = express();
const PORT = 4000;

// Enable CORS for your frontend origin
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Optional: Request logging
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

// Routes
app.use('/api/users', userRouter);
app.use('/api/users/auth', googleAuthRoutes);
app.use('/api/podcast', podcastRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/youtube', youtubeRoutes);



app.use(errorMiddleware);

// Start server
app.listen(PORT, (error) => {
  if (!error) {
    console.log("Server is running on port:", PORT);
  } else {
    console.error("Failed to start server:", error);
  }
});
