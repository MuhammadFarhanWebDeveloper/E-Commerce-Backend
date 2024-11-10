import { validationResult } from "express-validator";
import jsonwebtoken from "jsonwebtoken";
import prisma from "../utils/db.config.js";
import bcryptjs from "bcryptjs";
import sendVerificationEmail from "../utils/sendVerificationEmail.js";
import sendPasswordResetEmail from "../utils/sendPasswordResetEmail.js";
import sendWelcomeEmail from "../utils/sendWelcomeEmail.js";
import cloudinary from "../utils/cloudinary.config.js";

export const sendOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcryptjs.genSalt(10);
    const hashedOTP = await bcryptjs.hash(otp, salt);
    await sendVerificationEmail(email, otp);
    const payload = {
      email,
      otp: hashedOTP,
    };
    const otpsent = jsonwebtoken.sign(payload, process.env.JWT_SECRET);
    res.set("otpsent", otpsent);
    res
      .cookie("otpsent", otpsent, {
        maxAge: 15 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .json({ success: true, message: "Verification Email sent " });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const email = req.userEmail;
  const storedOtp = req.storedOtp;

  try {
    const comparedOtp = await bcryptjs.compare(otp, storedOtp);
    if (!comparedOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const payload = {
      email: email,
    };

    const verified = jsonwebtoken.sign(payload, process.env.JWT_SECRET);
    res.set("verified", verified);
    res
      .cookie("verified", verified, {
        maxAge: 15 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .json({
        success: true,
        message: "User verified successfully",
      });
  } catch (error) {
    res.status(400).json({ message: "Error during OTP verification." });
  }
};
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  try {
    const { firstName, lastName, password, isSeller, isAdmin } = req.body;
    const email = req.userEmail;
    const username = email.split("@")[0];

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "This user already exists",
      });
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        isSeller,
        isAdmin,
      },
    });

    const { password: userPassword, ...sendUser } = newUser;

    await sendWelcomeEmail(newUser.email, newUser.username);

    const payload = {
      email: newUser.email,
      id: newUser.id,
    };

    const authtoken = jsonwebtoken.sign(payload, process.env.JWT_SECRET);
    res.set("authtoken", authtoken);
    res
      .cookie("authtoken", authtoken, {
        maxAge: 10 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      })
      .json({
        success: true,
        user: sendUser,
        message: "User created successfully",
      });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
      include: {
        seller: true,
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const comparePassword = await bcryptjs.compare(password, user.password);
    if (!comparePassword) {
      return res
        .status(400)
        .json({ success: false, message: "Password was not matched" });
    }

    const { password: userPassword, ...userWithoutPassword } = user;

    const payload = {
      email: user.email,
      id: user.id,
    };

    const authtoken = jsonwebtoken.sign(payload, process.env.JWT_SECRET);
    res.set("authtoken", authtoken);
    res
      .cookie("authtoken", authtoken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
        partitioned: true,
      })
      .json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const updateUserInfo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  try {
    const { firstName, lastName, bio, address, phoneNumber } = req.body;

    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    if (bio) updateData.bio = bio;
    if (address) updateData.address = address;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "profilePictures",
      });
      updateData.profilePicture = uploadResult.secure_url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
    });
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    });

    await sendPasswordResetEmail(email, resetToken);
    const payload = {
      email: user.email,
      id: user.id,
    };
    const resetPasswordToken = jsonwebtoken.sign(
      payload,
      process.env.JWT_SECRET
    );
    res.status(200).cookie("resetpasswordtoken", resetPasswordToken, {
      maxAge: 15 * 60 * 1000,
      sameSite: "none",
      secure: true,
    });
    res.set("resetpasswordtoken", resetPasswordToken);

    res.json({
      success: true,
      message: "Password reset OTP sent to your email.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the request.",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { otp, newPassword } = req.body;
  const email = req.userEmail;
  console.log(`The Email is >> ${email}`);
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (user.resetToken !== otp || user.resetTokenExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while resetting the password.",
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        bio: true,
        isSeller: true,
        isAdmin: true,
        profilePicture: true,
        createdAt: true,
        phoneNumber: true,
        address: true,
        updatedAt: true,
        seller: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found",
      user,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .clearCookie("authtoken", {})
      .json({ success: true, message: "Successfully Logged out" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const deletedUser = await prisma.user.delete({
      where: { email },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const becomeSeller = async (req, res) => {
  try {
    const { storeName, storeDescription, businessAddress, socialMediaLinks } =
      req.body;
    const userId = req.userId;

    let storeLogo = null;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "storeLogos",
      });
      storeLogo = uploadResult.secure_url;
    }

    if (!storeName) {
      return res.status(400).json({
        success: false,
        message: "Store Name is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isSeller) {
      return res
        .status(400)
        .json({ success: false, message: "User is already a seller" });
    }

    const seller = await prisma.seller.create({
      data: {
        userId: userId,
        storeName: storeName,
        storeDescription: storeDescription || null,
        storeLogo: storeLogo || null,
        businessAddress: businessAddress || null,
        socialMediaLinks: socialMediaLinks
          ? JSON.parse(socialMediaLinks)
          : null,
      },
    });

    const newUser = await prisma.user.update({
      where: { id: userId },
      data: { isSeller: true },
      include: {
        seller: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Seller profile created successfully",
      user: newUser,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateSellerInfo = async (req, res) => {
  try {
    const { storeName, storeDescription, businessAddress, socialMediaLinks } =
      req.body;
    const sellerId = req.sellerId;

    const seller = await prisma.seller.findUnique({
      where: { id: parseInt(sellerId) },
    });

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    let storeLogo = null;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "storeLogos",
      });
      storeLogo = uploadResult.secure_url;
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: seller.id },
      data: {
        storeName: storeName || seller.storeName,
        storeDescription: storeDescription || seller.storeDescription,
        businessAddress: businessAddress || seller.businessAddress,
        socialMediaLinks: socialMediaLinks
          ? JSON.parse(socialMediaLinks)
          : seller.socialMediaLinks,
        storeLogo: storeLogo || seller.storeLogo,
      },
    });

    res.status(200).json({
      success: true,
      message: "Seller information updated successfully",
      seller: updatedSeller,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
