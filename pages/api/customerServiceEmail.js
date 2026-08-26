import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { to, subject, message } = req.body;

    // Configure transporter with your Vercel environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,   // e.g. mail.madacan.com
      port: process.env.SMTP_PORT,   // usually 587 for TLS
      secure: false,                 // true if port 465
      auth: {
        user: process.env.EMAIL_USER, // your email account
        pass: process.env.EMAIL_PASS  // your email password or app password
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: false
      },
      logger: true,   // enable logging
      debug: true     // show SMTP handshake in console
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER, // sender address
        to,                           // recipient(s)
        subject,
        text: message
      });
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("✗ Email sending failed:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
