import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

/**
 * Function to send an order notification email to the seller
 * @param {string} sellerEmail - Seller's email address
 * @param {object} buyer - Buyer details { firstName, lastName, address, email }
 * @param {object} product - Product details { name, quantity, price }
 */
async function sendOrderNotificationEmail(sellerEmail, buyer, product) {
  const { firstName, lastName, address, email: buyerEmail } = buyer;
  const { name: productName, quantity, price } = product;
  const totalPrice = quantity * price;

  const mailOptions = {
    from: process.env.EMAIL,
    to: sellerEmail,
    subject: "New Order Received",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Order Notification</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <p>Hello,</p>
          <p>You have received a new order. Here are the details:</p>

          <h2>Buyer Details</h2>
          <p><strong>First Name:</strong> ${firstName}</p>
          <p><strong>Last Name:</strong> ${lastName}</p>
          <p><strong>Email:</strong> ${buyerEmail}</p>
          <p><strong>Address:</strong> ${address}</p>

          <h2>Order Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Price</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${productName}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$${price.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">$${totalPrice.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <p>Thank you for using our service!</p>
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
    console.error("Error sending email:", error);
    throw new Error("Can't send order notification email");
  }
}

export default sendOrderNotificationEmail;
