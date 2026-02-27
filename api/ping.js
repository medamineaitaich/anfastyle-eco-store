export default function handler(req, res) {
  // Deployment trigger no-op endpoint
  res.status(200).json({ ok: true, message: "ping works" });
}
