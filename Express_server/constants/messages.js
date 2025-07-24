const Messages = {
    SUCCESS: {
      USER_REGISTERED: 'User created. Verification email sent.',
      EMAIL_VERIFIED: 'Email verified successfully!',
      RESEND_VERIFY_LINK : "New verification email sent",
      Mobile_VERIFIED_DONE : "Mobile verified. Registration complete."
      
    },
    ERROR: {
      EMAIL_ALREADY_REGISTERED: 'Email already registered',
      EMAIL_ALREADY_VERIFIED: 'Email already verified', // Add this
      REVERIFIED_EMAIL : 'Verification email already sent. Please check your inbox or try again after 15 minutes.',
      NOT_PENDING_VERFICATION : 'No pending verification found. Please register again.',
      INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired verification link. Please register again.',
      SERVER_ERROR: 'Internal server error',
      EMAIL_VERIFICATION_FAILED: 'Email verification failed. Please try again.',
      INVALID_EMAIL_FORMAT : 'Invalid email format',
      INVALID_OR_EXPIRED_OTP :"Invalid or expired OTP",
      USER_NOT_FOUND:"User not found",
      EMAIL_AND_OTP_ARE_REQUIRED :"Email and OTP are required" ,
      FAILED_TO_SEND_OTP :"Failed to send OTP. Please try again.",
    }
  };
  
  module.exports = Messages;
