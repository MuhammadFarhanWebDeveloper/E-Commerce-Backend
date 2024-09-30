import { validationResult } from "express-validator";
import prisma from "../utils/db.config.js";
import cloudinary from "../utils/cloudinary.config.js";

export const uploadProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = req.userId;
    const { name, description, price, categoryName } = req.body;
    const images = req.files;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    const imageUrls = await Promise.all(
      images.map((file) =>
        cloudinary.uploader
          .upload(file.path, { folder: "products" })
          .then((result) => result.secure_url)
      )
    );

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        sellerId: userId,
        categoryId: category.id,
      },
    });

    // Store uploaded image URLs in the database
    await prisma.image.createMany({
      data: imageUrls.map((url) => ({
        url,
        productId: product.id,
      })),
    });

    res.status(201).json({
      success: true,
      message: "Product uploaded successfully",
      product,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getOneProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId, 10) },
      include: {
        seller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            username: true,
          },
        },
        category: true,
        images: true,
      },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const getManyProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);
    const offset = (pageInt - 1) * limitInt;

    const filters = {};

    // Combine category and search filters using AND
    if (category || search) {
      filters.AND = [];

      if (category) {
        filters.AND.push({ category: { name: category } });
      }

      if (search) {
        filters.AND.push({
          OR: [
            { name: { search: search } },
            { description: { search: search } },
          ],
        });
      }
    }

    // Fetch products from the database
    const products = await prisma.product.findMany({
      where: filters,
      include: {
        seller: true,
        category: true,
        images: true,
      },
      orderBy: {
        [sortBy]: order,
      },
      skip: offset,
      take: limitInt,
    });

    const totalCount = await prisma.product.count({
      where: filters,
    });

    const totalPages = Math.ceil(totalCount / limitInt);

    // Return the list of products and pagination details
    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: pageInt,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limitInt,
      },
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, categoryName } = req.body;
    const userId = req.userId; // Assuming `userId` is set by authentication middleware

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.sellerId !== userId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You are not authorized to edit this product",
        });
    }
    let category;
    if (categoryName) {
      category = await prisma.category.findUnique({
        where: { name: categoryName },
      });

      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (description) updateData.description = description;
    if (category) updateData.categoryId = category.id;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this product",
      });
    }

    const deletedProduct = await prisma.product.delete({
      where: { id: parseInt(id, 10) },
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const uploadProductImages = async (req, res) => {
  try {
    const images = req.files;
    const { productid } = req.params;
    const userId = req.userId;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productid, 10) },
    });
    if (!product) {
      return req.status(400).json({
        success: false,
        message: "Sorry, We could'nt found your product",
      });
    }
    if (product.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to upload images for this product",
      });
    }
    const imageUrls = await Promise.all(
      images.map((file) =>
        cloudinary.uploader
          .upload(file.path, { folder: "products" })
          .then((result) => result.secure_url)
      )
    );

    await prisma.image.createMany({
      data: imageUrls.map((url) => ({
        url,
        productId: parseInt(productid, 10),
      })),
    });

    res.status(201).json({
      success: true,
      message: "Product's Images uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const userId = req.userId;

    const image = await prisma.image.findUnique({
      where: { id: parseInt(imageId, 10) },
      include: { product: true },
    });
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    if (image.product.sellerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this image",
      });
    }

    const publicId = image.url.split("/").pop().split(".")[0];

    await cloudinary.uploader.destroy(publicId);

    await prisma.image.delete({ where: { id: parseInt(imageId, 10) } });

    res
      .status(200)
      .json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.userId;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId, 10) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId: parseInt(productId, 10),
      },
    });

    if (existingCartItem) {
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: quantity,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Product quantity updated in the cart",
        cartItem: updatedCartItem,
      });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        userId,
        productId: parseInt(productId, 10),
        quantity: quantity || 1,
      },
    });

    res.status(201).json({
      success: true,
      message: "Product added to the cart",
      cartItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const userId = req.userId;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(cartItemId, 10) },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    if (cartItem.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to remove this item from the cart",
      });
    }

    await prisma.cartItem.delete({
      where: { id: parseInt(cartItemId, 10) },
    });

    res.status(200).json({
      success: true,
      message: "Item removed from the cart",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
