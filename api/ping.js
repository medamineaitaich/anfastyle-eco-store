module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    wc_url: process.env.WC_URL || null,
    has_key: !!process.env.WC_KEY,
    has_secret: !!process.env.WC_SECRET,
  });
};
