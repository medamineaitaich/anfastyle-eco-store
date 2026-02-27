import { wooFetch } from "./_lib/woo.js";

export default async function handler(req, res) {
  try {
    const {
      page = "1",
      per_page = "12",
      search,
      category,
      orderby = "date",
      order = "desc",
      status = "publish",
    } = req.query || {};

    const data = await wooFetch("products", {
      params: {
        page,
        per_page,
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        orderby,
        order,
        status,
      },
    });

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
