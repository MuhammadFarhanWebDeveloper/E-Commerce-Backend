import nodemailer from "nodemailer";
// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL, // Your Gmail address
    pass: process.env.APP_PASSWORD, // Your App Password
  },
});

/**
 * Function to send a verification email
 * @param {string} to - Recipient's email address
 * @param {string} verificationCode - The verification code to send
 */
async function sendVerificationEmail(to, verificationCode) {
  const mailOptions = {
    from: process.env.EMAIL, // Sender address
    to: to, // Recipient address
    subject: "Verify Your Email", // Subject line
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email to login into Farhan-Haris-E-Commerce</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verify Your Email</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <p>Hello,</p>
          <p>Thank you for signing up! Your verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">${verificationCode}</span>
          </div>
          <p>Enter this code on the verification page to complete your registration.</p>
          <p>This code will expire in 15 minutes for security reasons.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
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
    // Send email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Can't sent verification email");
  }
}

export default sendVerificationEmail;
