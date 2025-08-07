import dotenv from 'dotenv';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './config/passport.js';
import './utils/expirePlans.js';
import './utils/clean-jobs.js';

import errorMiddleware from './middlewares/errorMiddleware.js';
import { config } from './config/environment.js';

dotenv.config({ path: './.env' });

const app = express();
const PORT = 4000;

// Enable CORS for your frontend origin
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    console.warn(`Origin ${origin} not allowed by CORS`);
    callback(null, true); // For safety during transition, allow all
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // Handle preflight OPTIONS requests

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Optional: Request logging
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

// Add logging for route registration
console.log('Loading routes...');

// Try importing each route file individually to detect issues
import userRouter from './routes/userRoutes.js';
console.log('Loaded user routes');

import googleAuthRoutes from './routes/googleAuthRoutes.js';
console.log('Loaded Google auth routes');

import podcastRouter from './routes/podcast.js';
console.log('Loaded podcast routes');

import paymentRouter from './routes/payment.js';
console.log('Loaded payment routes');

import youtubeRoutes from './routes/youtubeRoutes.js';
console.log('Loaded YouTube routes');

import adminRoutes from './routes/adminRoutes.js';
console.log('Loaded admin routes');
console.log('Admin routes object:', Object.keys(adminRoutes)); // Log the admin routes object

// Now use them
app.use('/api/users', userRouter);
app.use('/api/users/auth', googleAuthRoutes);
app.use('/api/podcast', podcastRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/admin', adminRoutes); // New route registration
console.log('Registered admin routes at /api/admin'); // Log the registration of admin routes

// Optional: Add debugging to see which routes are registered
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods);
          routes.push({ path: middleware.regexp + path, methods });
        }
      });
    }
  });
  res.json(routes);
});

app.use(errorMiddleware);

// Start server
app.listen(PORT, (error) => {
  if (!error) {
    console.log("Server is running on port:", PORT);
  } else {
    console.error("Failed to start server:", error);
  }
});
