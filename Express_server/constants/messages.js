const Messages = {
    SUCCESS: {
      USER_REGISTERED: 'User created. Verification email sent.',
      EMAIL_VERIFIED: 'Email verified successfully!',
    },
    ERROR: {
      EMAIL_ALREADY_REGISTERED: 'Email already registered',
      INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token',
      SERVER_ERROR: 'Internal server error',
      EMAIL_VERIFICATION_FAILED: 'Email verification failed. Please try again.',
    }
  };
  
  module.exports = Messages;
  