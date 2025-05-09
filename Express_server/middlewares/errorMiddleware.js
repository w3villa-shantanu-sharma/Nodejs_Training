const Messages = require('../constants/messages');
const StatusCodes = require('../constants/statusCode');

const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: err.message || Messages.ERROR.SERVER_ERROR,
  });
};

module.exports = errorMiddleware;
