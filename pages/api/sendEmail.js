import sendgrid from "@sendgrid/mail";

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
  const ccRecipients = asAddressList(cc);
  if (!toRecipients.length || typeof subject !== "string" || (!text && !html)) {
    return res.status(400).json({ error: "Expected to, subject, and text or html" });
  }

  if (!process.env.SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY is not configured");
    return res.status(500).json({ error: "Email service is not configured" });
  }

  try {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
    const [info] = await sendgrid.send({
      from: '"Fleet App" <noreply@madacan.com>',
      to: toRecipients,
      ...(ccRecipients.length ? { cc: ccRecipients } : {}),
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
    });
    return res.status(200).json({ success: true, messageId: info.headers?.["x-message-id"] });
  } catch (error) {
    console.error("Fleet email delivery failed:", error.message);
    return res.status(502).json({ error: "Email delivery failed" });
  }
}
