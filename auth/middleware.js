const User = require("../models").user;
const { toData } = require("./jwt");

async function auth(req, res, next) {
  const auth =
    req.headers.authorization && req.headers.authorization.split(" ");

  if (!auth || !(auth[0] === "Bearer") || !auth[1]) {
    return res.status(401).json({
      message:
        "This endpoint requires an Authorization header with a valid token",
    });
  }

  try {
    const data = toData(auth[1]);
    const user = await User.findByPk(data.userId);
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    // add user object to request
    req.user = user;
    // next handler
    return next();
  } catch (error) {
    console.log("ERROR IN AUTH MIDDLEWARE", error);

    switch (error.name) {
      case "TokenExpiredError":
        return res
          .status(401)
          .json({ error: error.name, message: error.message });

      case "JsonWebTokenError":
        return res
          .status(400)
          .json({ error: error.name, message: error.message });

      default:
        return res.status(400).json({
          message: "Something went wrong, sorry",
        });
    }
  }
}

module.exports = auth;
