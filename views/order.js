import express from "express";
import isUserLoggedIn from "../middleware/isUserLoggedIn.js";
import { isSeller } from "../middleware/isUserSeller.js";
import {
  buyProduct,
  deleteOrder,
  getOrder,
  getOrders,
} from "../controllers/order.controller.js";

const order = express.Router();

order.post("/buy/:id", isUserLoggedIn, buyProduct);
order.get("/get-order/:id", isUserLoggedIn, isSeller, getOrder);
order.delete("/delete/:id", isUserLoggedIn, isSeller, deleteOrder);
order.get("/get-orders", isUserLoggedIn, isSeller, getOrders);

export default order;
