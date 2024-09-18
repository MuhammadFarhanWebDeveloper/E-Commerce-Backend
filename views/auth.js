import express from "express";
import { body } from "express-validator";
import isUserLoggedIn from "../middleware/isUserLoggedIn.js";
import {
  forgotPassword,
  getUser,
  login,
  logout,
  register,
  resetPassword,
  sendOTP,
  verifyOTP,
} from "../controllers/auth.controller.js";
import isTokenSent from "../middleware/isTokenSent.js";
import isTokenVerified from "../middleware/isTokenVerified.js";

const router = express.Router();

const registerFieldsValidation = [
  body("firstName", "First Name must be included").isLength({
    min: 4,
    max: 20,
  }),
  body("lastName", "First Name must be included").isLength({
    min: 4,
    max: 20,
  }),
  body("isAdmin", "Admin must be boolean ie true or false").default(false),
  body("isSeller", "Admin must be boolean ie true or false").default(false),
  body("password", "password must be greater than 4 character").isLength({
    min: 4,
  }),
];
const loginFieldsValidation = [
  body("email", "Enter a valid email").isEmail(),
  body("password", "password must be greater than 4 character").isLength({
    min: 4,
  }),
];
const updateUserValidation = [
  
]
const sendOTPValidation = [body("email", "Enter a valid email").isEmail()];
router.post("/send-otp", sendOTPValidation, sendOTP);
router.post("/verify-otp", isTokenSent, verifyOTP);
router.post("/register", isTokenVerified, registerFieldsValidation, register);
router.post("/login", loginFieldsValidation, login);
router.post("/update-user",)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword, resetPassword);

router.post("/logout", isUserLoggedIn, logout);
router.post("/getuser", isUserLoggedIn, getUser);
export default router;
