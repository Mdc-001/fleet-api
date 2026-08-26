import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { requestId, plate, driverName, serviceProvider, billingGroupId } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: "mail.madacan.com",
      port: 587, // use 465 if SSL
      secure: false, // true if port 465
      auth: {
        user: "QUANTUMI\\applications",
        pass: process.env.EMAIL_PASS, // store password in Vercel env
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: "noreply@madacan.com",
      to: "scm-team@example.com",
      subject: "🛞 New Customer Service Request",
      text: `Request ID: ${requestId}
Plate: ${plate}
Driver: ${driverName}
Service Provider: ${serviceProvider}
Billing Group: ${billingGroupId}`,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      id: info.messageId,
    });
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}
