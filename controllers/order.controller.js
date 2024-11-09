import prisma from "../utils/db.config.js";

export const buyProduct = async (req, res) => {
  const reqBody = req.body;

  try {
    const productId = parseInt(req.params.id);
    const quantity = parseInt(reqBody.quantity);
    const address = reqBody.address;
    const userId = req.userId;

    // Address validation
    if (!address || address.length < 5) {
      return res
        .status(400)
        .json({ success: false, message: "Address must be valid" });
    }

    // Fetch product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Check if enough stock is available
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Not enough stock available" });
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if user has sufficient balance

    // Deduct balance from the user

    // Create the order
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        productId,
        quantity,
      },
    });

    // Decrease the stock of the product
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
