const cron = require('node-cron');
const userRepo = require('../utils/userQueryData');

cron.schedule('*/30 * * * *', async () => {
  const now = new Date();
  const expiredUsers = await userRepo.getExpiredPlans(now);

  for (const user of expiredUsers) {
    await userRepo.expireUserPlan(user.uuid);
  }

  console.log(`Expired plans checked at ${now}`);
});
