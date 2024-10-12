import jwt from "jsonwebtoken";

const isUserLoggedIn = (req, res, next) => {
  const token = req.header("authtoken") || req.cookies.authtoken;
  console.log("Here I am")
  if (!token){
    console.log(req.header)
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    console.log("lkasdjfal")
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Here I'm working")

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
