const asyncHandler = (fn) => {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (err) {
        next(err); // Pass error 
      }
    };
  };
  
  module.exports = asyncHandler;
  