import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

async function sendPasswordResetEmail(to, resetCode) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: "Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request for Farhan-Haris-E-Commerce</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #FF5722, #E64A19); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the code below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #FF5722;">${resetCode}</span>
          </div>
          <p>This code will expire in 15 minutes for security reasons. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>Your App Team</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Unable to send password reset email");
  }
}

export default sendPasswordResetEmail;
