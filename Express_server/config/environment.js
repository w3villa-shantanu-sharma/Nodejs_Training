import dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  // Core URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://podacast-linker.vercel.app',
  BACKEND_URL: process.env.BACKEND_URL || 'https://nodejs-training-rk0a.onrender.com',
  
  // Auth config
  JWT_SECRET: process.env.JWT_SECRET ,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  
  // Cookie settings
  COOKIE_SECURE: isProd,
  COOKIE_SAMESITE: isProd ? 'none' : 'lax', // 'none' allows cross-site cookies in prod
  
  // CORS domains
  ALLOWED_ORIGINS: [
    'https://podacast-linker.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    // Add any additional domains if needed
  ],
  
  // Cookie settings
  COOKIE_SECURE: process.env.NODE_ENV === 'production', // true in production
  COOKIE_SAMESITE: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  
  // OAuth callbacks
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 
    'https://nodejs-training-rk0a.onrender.com/api/users/auth/google/callback',
  
  // Port configuration
//   PORT: process.env.PORT || 4000
};