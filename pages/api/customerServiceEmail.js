import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { plate, driverName, serviceProvider, billingGroupId } = req.body;
    console.log("→ Incoming request:", { plate, driverName, serviceProvider, billingGroupId });

    // For testing: always send to MichelJR
    const toRecipients = ["MichelJR@madacan.com"];

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true,
    });

    try {
      const info = await transporter.sendMail({
        from: '"Fleet App" <noreply@madacan.com>',
        to: toRecipients,
        subject: `New Request for ${plate}`,
        text: `Hello Michel,

A new request has been created.

Plate: ${plate}
Driver: ${driverName}
Service Provider: ${serviceProvider}
Billing Group: ${billingGroupId || "N/A"}

Thanks,
Fleet Management System`,
      });

      console.log("✓ Email sent successfully:", info.response);
      res.status(200).json({ success: true, response: info.response });
    } catch (error) {
      console.error("✗ Email sending failed:", error.message);
      res.status(500).json({ error: "Failed to send email", details: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
