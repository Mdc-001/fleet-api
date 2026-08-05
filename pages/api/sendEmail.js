export default function handler(req, res) {
  if (req.method === 'POST') {
    res.status(200).json({ success: true, message: "API route is working" });
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
