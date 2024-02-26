const apiError = require("../exceptions/apiErroe");
const tokenService = require("../services/tokenService");

module.exports = function (req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      return next(apiError.UnauthorizedError());
    }

    const accessToken = authorizationHeader.split(" ")[1];
    if (!accessToken) {
      return next(apiError.UnauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) {
      return next(apiError.UnauthorizedError());
    }

    req.user = userData;
    next();
  } catch (error) {
    return next(apiError.UnauthorizedError());
  }
};
