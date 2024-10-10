import prisma from "../utils/db.config.js";

export const AddCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (name.length < 3) {
      return res
        .status(400)
        .json({ success: false, message: "Name is too short" });
    }

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    const newCategory = await prisma.category.create({
      data: { name },
    });

    return res
      .status(201)
      .json({
        success: true,
        category: newCategory,
        message: "Category added successfully",
      });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }, // Ensure the ID is parsed as an integer
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    return res.status(200).json({ success: true, category });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate the category name length
    if (name.length < 3) {
      return res
        .status(400)
        .json({ success: false, message: "Name is too short" });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name },
    });

    return res
      .status(200)
      .json({
        success: true,
        data: updatedCategory,
        message: "Category updated successfully",
      });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the category exists
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    return res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
