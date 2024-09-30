import prisma from "../utils/db.config.js"
export const isSeller = async (req, res, next) => {
  try {
    const { userId } = req.user; 

    const seller = await prisma.seller.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!seller) {
      return res.status(403).json({ success: false, message: "Access denied. User is not a seller." });
    }

    req.seller = seller;

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
