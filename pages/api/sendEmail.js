import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // ✅ Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // ✅ Authorization check
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (token !== process.env.API_SECRET) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  // ✅ Validate request body
  const { to, cc, subject, text } = req.body || {};
  if (!to || !subject || !text) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    // ✅ Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.madacan.com",
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: false, // TLS on 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: false,
      },
    });

    // ✅ Send email
    await transporter.sendMail({
      from: `"Fleet App" <noreply@madacan.com>`,
      to,
      cc,
      subject,
      text,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Nodemailer error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
