import express from "express";
import {
  AddCategory,
  deleteCategory,
  getAllCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller.js";

const category = express.Router();

category.post("/create", AddCategory);
category.get("/:id", getCategory);
category.get("/all", getAllCategories);
category.put("/update/:id", updateCategory);
category.delete("/delete/:id", deleteCategory);

export default category;
