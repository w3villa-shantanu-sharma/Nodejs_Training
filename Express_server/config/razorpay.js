const Razorpay = require('razorpay');

// Add error handling and logging for initialization
let razorpay;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    console.error('⚠️ Razorpay credentials missing in environment variables!');
  }
  
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });
  
  console.log('✅ Razorpay initialized successfully');
} catch (err) {
  console.error('❌ Failed to initialize Razorpay:', err);
  // Create a dummy instance that will throw clear errors when used
  razorpay = {
    orders: {
      create: () => Promise.reject(new Error('Razorpay not properly initialized')),
    },
  };
}

module.exports = razorpay;
