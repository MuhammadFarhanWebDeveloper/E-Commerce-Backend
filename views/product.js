import express from "express";
import isUserLoggedIn from "../middleware/isUserLoggedIn.js";
import {
  deleteProduct,
  editProduct,
  getManyProducts,
  getOneProduct,
  uploadProduct,
} from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";
import isUserSeller from "../middleware/isUserSeller.js";
const router = express.Router();

router.get("/get-many-poducts", getManyProducts);
router.get("/get-one-poduct/:id", getOneProduct);
router.post(
  "/add-product",
  isUserLoggedIn,
  upload.array("images"),
  uploadProduct
);
router.put("/edit-product/:id", isUserSeller, editProduct);
router.delete("/delete-product/:id", isUserSeller, deleteProduct);

export default router;