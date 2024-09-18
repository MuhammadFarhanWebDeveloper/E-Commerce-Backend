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

    console.log(images)
    console.log(name, description, price, categoryName)
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
      where: { id: parseInt(productId) },
      include: {
        seller: {
          select:{
            firstName:true,
            lastName:true,
            email:true,
            username:true
          }
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

    const limitInt = parseInt(limit);
    const pageInt = parseInt(page);
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
    const { id } = req.params; // Get product ID from request parameters
    const { name, price, description, categoryName } = req.body; // Get updated product details from request body

    // Find the category by name if `categoryName` is provided
    let category;
    if (categoryName) {
      category = await prisma.category.findUnique({
        where: { name: categoryName },
      });

      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
    }

    // Prepare the update data object dynamically
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (description) updateData.description = description;
    if (category) updateData.categoryId = category.id; // If category exists, update `categoryId`

    // Update product with the fields that were provided
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

    const deletedProduct = await prisma.product.delete({
      where: { id: parseInt(id, 10) }, 
    });

    res.status(200).json({ success: true, message: "Product deleted successfully", product: deletedProduct });
  } catch (error) {

    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

