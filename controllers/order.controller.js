import sendOrderNotificationEmail from "../utils/orderNotificationEmail.js";
import prisma from "../utils/db.config.js";

export const buyProduct = async (req, res) => {
  const reqBody = req.body;

  try {
    const productId = parseInt(req.params.id);
    const quantity = parseInt(reqBody.quantity);
    const address = reqBody.address;
    const userId = req.userId;

    if (!address || address.length < 5) {
      return res
        .status(400)
        .json({ success: false, message: "Address must be valid" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock available" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    await sendOrderNotificationEmail(
      product.seller.user.email,
      {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: address,
      },
      {
        name: product.name,
        quantity: quantity,
        price: product.price,
      }
    );

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
