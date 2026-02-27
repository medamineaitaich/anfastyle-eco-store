import { wooFetch } from "./_lib/woo.js";

export default async function handler(req, res) {
  try {
    const { per_page = "100", page = "1", hide_empty = "true" } = req.query || {};
    const data = await wooFetch("products/categories", {
      params: { per_page, page, hide_empty },
    });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
