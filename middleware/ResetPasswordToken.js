import jwt from "jsonwebtoken";

const resetPasswordToken = (req, res, next) => {
  const token =req.header("resetpasswordtoken") || req.cookies.resetpasswordtoken;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - no token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - invalid token" });
    }
    req.userEmail = decoded.email;
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.log("Error in verifyToken ", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export default resetPasswordToken;
