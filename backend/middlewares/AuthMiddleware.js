const jwt = require("jsonwebtoken");
const { UserModel } = require("../model/UserModel");

module.exports.userVerification = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(
      token,
      process.env.TOKEN_KEY || "secret_key_placeholder",
    );

    const user = await UserModel.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Not authorized" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
