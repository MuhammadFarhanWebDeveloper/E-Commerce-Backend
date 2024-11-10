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

    const totalPrice = product.price * quantity;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        productId,
        quantity,
      },
    });

    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getOrder = async (req, res) => {
  const orderId = parseInt(req.params.id);
  try {
    const sellerId = req.sellerId;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: true,
        product: true,
      },
    });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.seller.id != sellerId) {
      return res.status(401).json({
        success: false,
        message: "You've no permission to get this order.",
      });
    }

    res.status(200).json({ success: true, order: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const orders = await prisma.order.findMany({
      where: { sellerId: sellerId },
    });

    res.status(200).json({ success: true, orders: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteOrder = async (req, res) => {
  const orderId = parseInt(req.params.id);
  const sellerId = req.sellerId;

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, sellerId },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
  }
};

