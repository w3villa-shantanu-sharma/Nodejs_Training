// utils/plans.js
module.exports = {
  durations: {
    FREE: null,
    SILVER: 1 * 60 * 60 * 1000,     // 1 hour
    GOLD: 6 * 60 * 60 * 1000,       // 6 hours
    PREMIUM: 12 * 60 * 60 * 1000    // 12 hours
  },
  prices: {
    SILVER: 5000,   // ₹50.00 (in paise)
    GOLD: 10000,    // ₹100.00
    PREMIUM: 15000  // ₹150.00
  }
}
