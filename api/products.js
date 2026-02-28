export default function handler(req, res) {
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.status(307).setHeader("Location", `/api/store/products${qs}`).end();
}
