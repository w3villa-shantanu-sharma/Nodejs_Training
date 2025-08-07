const Messages = {
    SUCCESS: {
      USER_REGISTERED: "Registration successful! Check your email to verify your account.",
      RESEND_VERIFY_LINK: "Verification link has been resent to your email.",
      EMAIL_VERIFIED: "Email verified successfully!",
      Mobile_VERIFIED_DONE: "Mobile verified successfully!"
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
      SERVER_ERROR: "Internal server error."
    }
  };
  
  export default Messages;
