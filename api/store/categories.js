import { wooFetch } from "../_lib/woo.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    const { per_page = "100", page = "1", hide_empty = "true" } = req.query || {};

    const data = await wooFetch("products/categories", {
      params: { per_page, page, hide_empty },
    });

    const items = Array.isArray(data)
      ? data.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: c.count,
          parent: c.parent,
        }))
      : [];

    res.status(200).json({ source: "store-categories", items });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
