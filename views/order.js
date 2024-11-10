import express from "express";
import isUserLoggedIn from "../middleware/isUserLoggedIn.js";
import { isSeller } from "../middleware/isUserSeller.js";
import { buyProduct } from "../controllers/order.controller.js";

const order = express.Router();

order.post("/buy/:id", isUserLoggedIn, buyProduct);

export default order;
