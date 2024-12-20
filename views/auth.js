import express from "express";
import { body } from "express-validator";
import isUserLoggedIn from "../middleware/isUserLoggedIn.js";
import { isSeller } from "../middleware/isUserSeller.js";

import {
  becomeSeller,
  deleteUser,
  forgotPassword,
  getUser,
  login,
  logout,
  register,
  resetPassword,
  sendOTP,
  updateSellerInfo,
  updateUserInfo,
  verifyOTP,
} from "../controllers/auth.controller.js";
import isTokenSent from "../middleware/isTokenSent.js";
import isTokenVerified from "../middleware/isTokenVerified.js";
import resetPasswordToken from "../middleware/ResetPasswordToken.js";
import upload from "../middleware/multer.js";
const router = express.Router();

const registerFieldsValidation = [
  body("firstName")
    .isLength({ min: 4, max: 20 })
    .withMessage("First Name must be between 4 to 20 characters."),

  body("lastName")
    .isLength({ min: 4, max: 20 })
    .withMessage("Last Name must be between 4 to 20 characters."),

  body("isAdmin")
    .optional()
    .isBoolean()
    .withMessage("Admin must be a boolean (true or false)"),

  body("isSeller")
    .optional()
    .isBoolean()
    .withMessage("Seller must be a boolean (true or false)"),

  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters long."),
];
const loginFieldsValidation = [
  body("email").isEmail().withMessage("Please enter a valid email address."),

  body("password")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters long."),
];
const userUpdateValidation = [
  body("firstName")
    .optional()
    .isString()
    .withMessage("First name must be a string."),
  body("lastName")
    .optional()
    .isString()
    .withMessage("Last name must be a string."),
  body("bio").optional().isString().withMessage("Bio must be a string."),
  body("address")
    .optional()
    .isString()
    .withMessage("Address must be a string."),
  body("phoneNumber")
    .optional()
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number."),
];
const sendOTPValidation = [
  body("email").isEmail().withMessage("Enter a valid email"),
];

router.post("/send-otp", sendOTPValidation, sendOTP);
router.post("/verify-otp", isTokenSent, verifyOTP);
router.post("/register", isTokenVerified, registerFieldsValidation, register);
router.post("/login", loginFieldsValidation, login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordToken, resetPassword);

router.post("/logout", isUserLoggedIn, logout);
router.post("/getuser", isUserLoggedIn, getUser);
router.put(
  "/update-user",
  isUserLoggedIn,
  upload.single("profilePicture"),
  updateUserInfo
);
router.post(
  "/become-seller",
  isUserLoggedIn,
  upload.single("logo"),
  becomeSeller
);
router.put(
  "/edit-shop-info",
  isUserLoggedIn,
  isSeller,
  upload.single("logo"),
  updateSellerInfo
);
router.delete("/delete-user", deleteUser);

export default router;
