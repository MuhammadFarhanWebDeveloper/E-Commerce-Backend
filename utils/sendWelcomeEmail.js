import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

async function sendWelcomeEmail(to, username) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: "Welcome to Farhan-Haris-E-Commerce!",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Farhan-Haris-E-Commerce</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #FF5722, #E64A19); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Our Platform, ${username}!</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <p>Hello ${username},</p>
          <p>We are thrilled to welcome you to Platform! Thank you for signing up.</p>
          <p>Here are a few things you can do to get started:</p>
          <ul>
            <li>Explore the latest products on our platform.</li>
            <li>Customize your profile to let others know more about you.</li>
            <li>Check out the exclusive deals just for new users.</li>
          </ul>
          <p>We are always here to help if you have any questions or need assistance. Feel free to contact us.</p>
          <p>Best regards,<br>Farhan and Haris</p>
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
    console.error("Error sending welcome email:", error);
    throw new Error("Unable to send welcome email");
  }
}

export default sendWelcomeEmail;
