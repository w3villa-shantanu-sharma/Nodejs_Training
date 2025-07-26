const express = require('express');
const passport = require('passport');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });
require('./config/passport');
require('./utils/expirePlans');

const userRouter = require('./routes/userRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const podcastRouter = require('./routes/podcast');
const paymentRouter = require('./routes/payment');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();
const PORT = 4000;

//  Enable CORS for your frontend origin
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

//  Optional: Request logging
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

//  Routes
app.use('/api/users', userRouter);
app.use('/api/users/auth', googleAuthRoutes);
app.use('/api/podcast', podcastRouter);
app.use('/api/payment', paymentRouter);

app.use(errorMiddleware);

//  Start server
app.listen(PORT, (error) => {
  if (!error) {
    console.log(" Server is running on port:", PORT);
  } else {
    console.error(" Failed to start server:", error);
  }
});
