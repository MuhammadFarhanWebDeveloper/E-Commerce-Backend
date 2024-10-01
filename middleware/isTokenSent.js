import jwt from "jsonwebtoken";

const isTokenSent = (req, res, next) => {
  const token = req.header("otpsent") || req.cookies.otpsent;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - no token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - invalid token" });

    req.storedOtp = decoded.otp;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    console.log("Error in verifyToken ", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export default isTokenSent;
