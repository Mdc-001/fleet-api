import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { billingGroupId, requests = [], scmApproval, finalApproval } = req.body;
  console.log("→ Incoming email payload:", { billingGroupId, count: requests?.length, scmApproval, finalApproval });

  const allRequests = Array.isArray(requests)
    ? requests.flatMap(r => (r.requests ? r.requests : [r]))
    : [];

  const rows = allRequests.map(r => `
    <tr>
      <td>${r.plate || "N/A"}</td>
      <td>${r.driverName || "N/A"}</td>
      <td>${r.serviceProvider || "N/A"}</td>
      <td style="color:${r.status === "pending" ? "red" : "green"};">
        ${r.status || "N/A"}
      </td>
      <td>${
        r.repairDate
          ? (r.repairDate._seconds
              ? new Date(r.repairDate._seconds * 1000).toLocaleDateString("en-GB")
              : new Date(r.repairDate).toLocaleDateString("en-GB"))
          : "N/A"
      }</td>
    </tr>
  `).join("");

  // 🔧 Subject line
  const subject = scmApproval
    ? `SCM Approval Request – Waiting Final Approval (Batch ${billingGroupId})`
    : finalApproval
      ? `Final Approval Confirmation – Batch ${billingGroupId}`
      : billingBatchId
        ? `Grouped Tire Requests - Batch ${billingGroupId}`
        : "New Tire Request";

  // 🔧 Intro text
  const introText = scmApproval
    ? `All requests under batch <strong>${billingGroupId}</strong> have been approved by SCM.<br/><strong>Waiting for final approval</strong>`
    : finalApproval
      ? `All requests under batch <strong>${billingGroupId}</strong> have been <strong>Final Approved</strong>.`
      : billingGroupId
        ? `Here are the Tire requests for batch <strong>${billingGroupId}</strong>:`
        : "Here is the new Tire request:";

  const htmlBody = `
    <h2>${subject}</h2>
    <p>Hello team,</p>
    <p>${introText}</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead style="background-color: #f2f2f2;">
        <tr>
          <th>Plate</th>
          <th>Driver</th>
          <th>Service Provider</th>
          <th>Status</th>
          <th>Repair Date</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <p>Thanks,<br/>Fleet Management System</p>
  `;

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
      to: "MichelJR@madacan.com", // fixed recipient for now
      subject,
      html: htmlBody,
    });

    console.log("✓ Email sent successfully:", info.response);
    return res.status(200).json({ success: true, response: info.response });
  } catch (error) {
    console.error("✗ Email sending failed:", error.message);
    return res.status(500).json({ error: "Failed to send email", details: error.message });
  }
}
