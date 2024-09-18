import { validationResult } from "express-validator";
import jsonwebtoken from "jsonwebtoken";
import prisma from "../utils/db.config.js";
import bcryptjs from "bcryptjs";
import sendVerificationEmail from "../utils/sendVerificationEmail.js";
import sendPasswordResetEmail from "../utils/sendPasswordResetEmail.js";
import sendWelcomeEmail from "../utils/sendWelcomeEmail.js";
export const sendOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, message: "BKL use valid credentials," });
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
        .json({ success: true, message: "User already exists" });
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
    res
      .cookie("otpsent", otpsent, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
        sameSite: "none",
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
    res
      .cookie("verified", verified, {
        httpOnly: true,
        maxAge: 25 * 60 * 1000,
        sameSite: "none",
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
    return res
      .status(400)
      .json({ success: false, message: "BKL use valid credentials," });
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
    if (newUser.isSeller) {
      res.cookie("sellertoken", authtoken)
    }
    res
      .cookie("authtoken", authtoken, {
        httpOnly: true,
        maxAge: 10 * 24 * 60 * 60 * 1000, // Expires in 10 days
        sameSite: "none",
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
    return res
      .status(400)
      .json({ success: false, message: "BKL use valid credentials," });
  }
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email,
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
    const payload = {
      email: user.email,
      id: user.id,
    };

    const authtoken = jsonwebtoken.sign(payload, process.env.JWT_SECRET);
    res
      .cookie("authtoken", authtoken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
      })
      .json({ success: true, user });
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
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // OTP expires in 15 minutes

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
    res
      .status(200)
      .cookie("resetpasswordtoken", resetPasswordToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
        sameSite: "none",
      })
      .json({
        success: true,
        message: "Password reset OTP sent to your email.",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the request.",
    });
  }
};

export const resetPassword = async (req, res) => {
  const { otp, newPassword } = req.body;
  const email = req.userEmail;
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

    // Hash the new password

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
      .json({ success: false, message: "Password reset successfully." });
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
        updatedAt: true,
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
      .clearCookie("authtoken", {
        httpOnly: true,
      })
      .json({ success: true, message: "Successfully Logged out" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
