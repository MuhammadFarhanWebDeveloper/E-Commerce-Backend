import express from "express";
import isUserLoggedIn from "../middleware/isUserLoggedIn.js";
import {
  deleteProduct,
  editProduct,
  getManyProducts,
  getOneProduct,
  uploadProduct,
  uploadProductImages,
} from "../controllers/product.controller.js";
import upload from "../middleware/multer.js";
import { isSeller } from "../middleware/isUserSeller.js";
const router = express.Router();

router.get("/get-many-poducts", getManyProducts);
router.get("/get-one-product/:id", getOneProduct);
router.post("/add-product", isUserLoggedIn, isSeller, upload.array("images"), uploadProduct);
router.put("/edit-product/:id", isUserLoggedIn, isSeller,upload.array("images"), editProduct);
router.delete("/delete-product/:id", isUserLoggedIn, isSeller, deleteProduct);

router.post(
  "/upload-images/:productid",
  isUserLoggedIn,
  isSeller,
  uploadProductImages
);
export default router;
