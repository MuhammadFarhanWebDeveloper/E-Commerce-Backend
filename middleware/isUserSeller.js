import jwt from "jsonwebtoken";

const isUserSeller = (req, res, next) => {
  const token = req.cookies.sellertoken;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "You've no permission as a seller" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded)
      return res
        .status(401)
        .json({
          success: false,
          message: "Login as a seller using valid credentials",
        });

    req.userId = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
export default isUserSeller;
