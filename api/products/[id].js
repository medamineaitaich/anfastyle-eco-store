import { wooFetch } from "../_lib/woo.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: "Missing product id" });

    const data = await wooFetch(`products/${id}`);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
