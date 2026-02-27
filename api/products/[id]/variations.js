import { wooFetch } from "../../../_lib/woo.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: "Missing product id" });

    const { page = "1", per_page = "100" } = req.query || {};

    const variations = await wooFetch(`products/${id}/variations`, {
      params: { page, per_page },
    });

    res.status(200).json(variations);
  } catch (e) {
    // For simple products Woo may return an error; we convert it to an empty list
    const msg = e?.message || String(e);
    if (msg.includes("woocommerce_rest_product_invalid_id") || msg.includes("No route was found") || msg.includes("cannot be viewed")) {
      return res.status(200).json([]);
    }
    res.status(500).json({ error: msg });
  }
}
