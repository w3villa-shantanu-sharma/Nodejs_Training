import Messages from '../constants/messages.js';
import StatusCodes from '../constants/statusCode.js';

const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: err.message || Messages.ERROR.SERVER_ERROR,
  });
};

export default errorMiddleware;
