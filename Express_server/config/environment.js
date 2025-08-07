import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  // Core URLs
  FRONTEND_URL: process.env.FRONTEND_URL || (isProd ? 'https://your-vercel-app.vercel.app' : 'http://localhost:5173'),
  BACKEND_URL: process.env.BACKEND_URL || (isProd ? 'https://your-backend.onrender.com' : 'http://localhost:4000'),
  
  // Auth config
  JWT_SECRET: process.env.JWT_SECRET || 'pretty',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Cookie settings
  COOKIE_SECURE: isProd,
  COOKIE_SAMESITE: isProd ? 'none' : 'lax', // 'none' allows cross-site cookies in prod
  
  // CORS domains
  ALLOWED_ORIGINS: [
    isProd ? 'https://your-vercel-app.vercel.app' : 'http://localhost:5173',
    'http://localhost:5174' // Development alternative port
  ],
  
  // OAuth callbacks
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 
    (isProd ? 'https://your-backend.onrender.com/api/users/auth/google/callback' : 'http://localhost:4000/api/users/auth/google/callback'),
  
  // Port configuration
  PORT: process.env.PORT || 4000
};