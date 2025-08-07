import Razorpay from 'razorpay';

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
  razorpay = {
    orders: {
      create: () => Promise.reject(new Error('Razorpay not properly initialized')),
    },
  };
}

export default razorpay;
