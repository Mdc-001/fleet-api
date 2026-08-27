import nodemailer from "nodemailer";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (only once)
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { billingGroupId } = req.body;
    console.log("→ Incoming request for grouped email:", { billingGroupId });

    try {
      // Fetch all requests with the same billingGroupId
      const snapshot = await db
        .collection("customerServiceTracking")
        .where("billingGroupId", "==", billingGroupId)
        .get();

      if (snapshot.empty) {
        console.warn("⚠️ No requests found for billing group:", billingGroupId);
        return res.status(404).json({ error: "No requests found" });
      }

      const requests = snapshot.docs.map(doc => doc.data());

      // Build HTML table rows
      const rows = requests.map(r => `
        <tr>
          <td>${r.plate || "N/A"}</td>
          <td>${r.driverName || "N/A"}</td>
          <td>${r.serviceProvider || "N/A"}</td>
          <td style="color:${r.status === "pending" ? "red" : "green"};">
            ${r.status || "N/A"}
          </td>
          <td>${r.repairDate ? new Date(r.repairDate._seconds * 1000).toLocaleDateString("en-GB") : "N/A"}</td>
        </tr>
      `).join("");

      const htmlBody = `
        <h2>Grouped Tire Requests - Batch ${billingGroupId}</h2>
        <p>Hello team,</p>
        <p>Here are the Tire requests for batch <strong>${billingGroupId}</strong>:</p>
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

      // Nodemailer transporter
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

      // Send grouped email
      const info = await transporter.sendMail({
        from: '"Fleet App" <noreply@madacan.com>',
        to: "MichelJR@madacan.com", // fixed recipient for testing
        subject: `Grouped Tire Requests - Batch ${billingGroupId}`,
        html: htmlBody,
      });

      console.log("✓ Grouped email sent successfully:", info.response);
      res.status(200).json({ success: true, response: info.response });
    } catch (error) {
      console.error("✗ Failed to send grouped email:", error.message);
      res.status(500).json({ error: "Failed to send grouped email", details: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
