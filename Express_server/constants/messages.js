const Messages = {
    SUCCESS: {
      USER_REGISTERED: "Registration successful! Check your email to verify your account.",
      RESEND_VERIFY_LINK: "Verification link has been resent to your email.",
      EMAIL_VERIFIED: "Email verified successfully!",
      Mobile_VERIFIED_DONE: "Mobile verified successfully!",
      USER_AUTHENTICATED: "User authenticated successfully",
      
      // Add these new success messages
      PROFILE_UPDATED: "Profile updated successfully",
      OTP_SENT: "OTP sent to phone",
      MOBILE_VERIFIED: "Mobile number verified successfully",
      PAYMENT_SUCCESSFUL: "Payment successful",
      NOTIFICATION_MARKED_SEEN: "Notification marked as seen"
    },
    ERROR: {
      EMAIL_ALREADY_REGISTERED: "Email already registered.",
      INVALID_EMAIL_FORMAT: "Invalid email format.",
      INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token.",
      EMAIL_AND_OTP_ARE_REQUIRED: "Email and OTP are required.",
      USER_NOT_FOUND: "User not found.",
      INVALID_OR_EXPIRED_OTP: "Invalid or expired OTP.",
      NOT_PENDING_VERFICATION: "No pending verification for this email.",
      REVERIFIED_EMAIL: "Email already verified or verification link was recently sent.",
      SERVER_ERROR: "Internal server error.",
      
      // Authentication errors
      AUTHENTICATION_REQUIRED: "Authentication required",
      TOKEN_EXPIRED: "Token expired, please login again",
      INVALID_TOKEN_FORMAT: "Invalid token format",
      AUTHENTICATION_FAILED: "Authentication failed",
      DATABASE_ERROR: "Database error",
      GOOGLE_EMAIL_EXISTS: "This e‑mail is already linked to a Google account. Please sign‑in with Google.",
      
      // User profile errors
      INVALID_USERNAME_FORMAT: "Invalid username format. Use 3-20 characters: a-z, 0-9, _",
      USERNAME_ALREADY_SET: "Username already set",
      PROFILE_UPDATE_FAILED: "Failed to update profile",
      DOWNLOAD_PROFILE_FAILED: "Could not download profile",
      UNAUTHORIZED: "Unauthorized",
      
      // OTP and verification errors
      SEND_OTP_FAILED: "Failed to send OTP. Please try again later.",
      OTP_RATE_LIMIT: "Too many OTP requests. Please wait 15 minutes.",
      EMAIL_RATE_LIMIT: "Too many verification emails sent. Try again later.",
      REGISTER_RATE_LIMIT: "Too many registration attempts. Try again in an hour.",
      
      // Payment errors
      INVALID_PLAN: "Invalid plan selected",
      PAYMENT_CONFIG_ERROR: "Payment service is not configured properly",
      
      // Notification errors
      FETCH_NOTIFICATION_FAILED: "Failed to fetch notifications",
      UPDATE_NOTIFICATION_FAILED: "Failed to update notification",
      
      // API errors
      SEARCH_PODCAST_FAILED: "Failed to search podcasts",
      USER_STATUS_CHECK_FAILED: "Server error checking user status"
    },
    
    // Add a new category for notification types
    NOTIFICATION: {
      PLAN_EXPIRED: "❗ Plan Expired",
      PLAN_EXPIRING: "⚠️ Plan Expiring Soon",
      SYSTEM: "📢 System Alert",
      PAYMENT: "💰 Payment Update",
      PODCAST: "🎙️ Podcast Update",
      PROFILE: "👤 Profile Update"
    }
  };
  
  export default Messages;
