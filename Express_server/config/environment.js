import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Core URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://podacast-linker.vercel.app',
  BACKEND_URL: process.env.BACKEND_URL || 'https://nodejs-training-rk0a.onrender.com',
  
  // CORS domains
  ALLOWED_ORIGINS: [
    'https://podacast-linker.vercel.app',
    'http://localhost:5173',
  ],
  
  // Cookie settings - always use secure settings for production
  COOKIE_SECURE: true,
  COOKIE_SAMESITE: 'none',
  
  // OAuth callbacks
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 
    'https://nodejs-training-rk0a.onrender.com/api/users/auth/google/callback',
};

// Cookie options for cross-domain compatibility
export const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
};