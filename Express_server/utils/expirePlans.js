import cron from 'node-cron';
import * as userRepo from './userQueryData.js';
import sendEmail from './plans_expired_email.js';

// Check expired plans every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  const now = new Date();
  
  try {
    // Handle already expired plans
    const expiredUsers = await userRepo.getExpiredPlans(now);
    for (const user of expiredUsers) {
      await userRepo.expireUserPlan(user.uuid);
      
      // Create notification for the user
      await userRepo.createUserNotification(
        user.uuid, 
        'PLAN_EXPIRED',
        `Your ${user.plan} plan has expired. You've been downgraded to the FREE plan.`
      );
      
      // Send email notification
      await sendEmail({
        to: user.email,
        subject: 'Your Podcast Hub Plan Has Expired',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Podcast Hub Plan Has Expired</h2>
            <p>Hello ${user.name},</p>
            <p>Your ${user.plan} plan has expired and your account has been downgraded to the FREE plan.</p>
            <p>If you'd like to continue enjoying premium features, please renew your subscription.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/payment" 
                style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Renew Subscription
              </a>
            </div>
            <p>Thank you for using Podcast Hub!</p>
          </div>
        `
      });
    }

    // Handle plans about to expire in the next 24 hours
    const expiringUsers = await userRepo.getExpiringPlans(24);
    for (const user of expiringUsers) {
      // Calculate hours remaining
      const hoursRemaining = Math.ceil((new Date(user.plan_expires_at) - now) / (1000 * 60 * 60));
      
      await userRepo.createUserNotification(
        user.uuid,
        'PLAN_EXPIRING',
        `Your ${user.plan} plan expires in ${hoursRemaining} hours. Renew now to avoid interruption.`
      );
      
      // Send email notification
      await sendEmail({
        to: user.email,
        subject: 'Your Podcast Hub Plan is Expiring Soon',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Plan is Expiring Soon</h2>
            <p>Hello ${user.name},</p>
            <p>Your ${user.plan} plan will expire in ${hoursRemaining} hours.</p>
            <p>Renew now to continue enjoying premium features without interruption.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/payment" 
                style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Renew Now
              </a>
            </div>
            <p>Thank you for using Podcast Hub!</p>
          </div>
        `
      });
      
      // Mark as notification sent
      await userRepo.markNotificationSent(user.uuid);
    }

    console.log(`Plan check completed at ${now}: ${expiredUsers.length} expired, ${expiringUsers.length} expiring soon`);
  } catch (err) {
    console.error('Error in plan expiration cron job:', err);
  }
});

export default {};
