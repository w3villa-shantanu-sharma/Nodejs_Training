const Messages = {
    SUCCESS: {
      USER_REGISTERED: 'User created. Verification email sent.',
      EMAIL_VERIFIED: 'Email verified successfully!',
      RESEND_VERIFY_LINK : "New verification email sent",
      
    },
    ERROR: {
      EMAIL_ALREADY_REGISTERED: 'Email already registered',
      REVERIFIED_EMAIL : 'Verification email already sent. Please check your inbox or try again after 15 minutes.',
      NOT_PENDING_VERFICATION : 'No pending verification found. Please register again.',
      INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token',
      SERVER_ERROR: 'Internal server error',
      EMAIL_VERIFICATION_FAILED: 'Email verification failed. Please try again.',
      INVALID_EMAIL_FORMAT : 'Invalid email format',
    }
  };
  
  module.exports = Messages;
  