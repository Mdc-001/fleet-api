import nodemailer from "nodemailer";

const asAddressList = (value) => {
  if (!value) return [];
  const entries = Array.isArray(value) ? value : [value];
  return entries.filter((entry) => typeof entry === "string" && entry.trim());
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiSecret = process.env.FLEET_EMAIL_API_SECRET;
  if (!apiSecret || req.headers.authorization !== `Bearer ${apiSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { to, cc, subject, text, html } = req.body || {};
  const toRecipients = asAddressList(to);
  if (!toRecipients.length || typeof subject !== "string" || (!text && !html)) {
    return res.status(400).json({ error: "Expected to, subject, and text or html" });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.madacan.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"Fleet App" <noreply@madacan.com>',
      to: toRecipients,
      cc: asAddressList(cc),
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
    });
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Fleet email delivery failed:", error.message);
    return res.status(502).json({ error: "Email delivery failed" });
  }
}
