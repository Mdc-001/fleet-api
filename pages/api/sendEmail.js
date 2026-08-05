import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { to, subject, text } = req.body;

  try {
    // Configure transporter with your SMTP service
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,   // e.g. "smtp.gmail.com"
      port: 587,
      secure: false,                 // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER, // your email
        pass: process.env.SMTP_PASS, // your password or app password
      },
    });

    // Send the email
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
