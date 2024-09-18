import jwt from "jsonwebtoken";

const isUserLoggedIn = (req, res, next) => {
  const token = req.cookies.authtoken;
  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded)
      return res.status(401).json({ success: false, message: "Unauthorized" });

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
export default isUserLoggedIn;
