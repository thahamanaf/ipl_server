const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const authorizeToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, keys.jwtSecret, (err, decoded) => {
      if (err) {
        if (err.message === "jwt expired") {
          return res.status(403).send({
            statusCode: 403,
            message: "KEY_EXPIRED",
            description: "Authorization key expired",
          });
        }
        return res.json({
          statusCode: 401,
          message: "UNAUTHORIZED",
          description: "Invalid Authorization key",
        });
      }

      req.decoded = decoded;
      return next();
    });
  } else {
    return res.json({
      statusCode: 401,
      message: "UNAUTHORIZED",
      description: "Please provide a valid authorization key",
    });
  }

};

const checkRoles = (allowedRoles) => ((req, res, next) => {
  const loggedInUser = req.decoded.data;
  if (!allowedRoles.includes(loggedInUser.role)) {
    res.status(403).send({
      status: false,
      statusCode: 403,
      message: "You do not have permission to access this resource.",
      error: "FORBIDDEN",
    });
    return
  }
  return next();
});

module.exports = {
  authorizeToken,
  checkRoles
}
