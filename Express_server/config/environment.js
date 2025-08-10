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
  
  // Cookie settings - critical for cross-domain auth
  COOKIE_SECURE: true, // Always true for production cross-domain
  COOKIE_SAMESITE: 'none', // Always 'none' for cross-domain cookies
  
  // OAuth callbacks
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 
    'https://nodejs-training-rk0a.onrender.com/api/users/auth/google/callback',
};

// Cookie options for cross-domain compatibility
export const cookieOptions = {
  httpOnly: true,
  secure: true, // Always true for production cross-domain
  sameSite: 'none', // Always 'none' for cross-domain
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/', // Ensure cookies are sent for all paths
};