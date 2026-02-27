export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    wc_url: process.env.WC_URL || null,
    has_key: !!process.env.WC_KEY,
    has_secret: !!process.env.WC_SECRET,
    vercel_env: process.env.VERCEL_ENV || null,
    vercel_url: process.env.VERCEL_URL || null,
  });
}
