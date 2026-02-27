import { wooFetch } from "./_lib/woo.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    const {
      page = "1",
      per_page = "12",
      search,
      category,
      orderby = "date",
      order = "desc",
      status = "publish",
      featured,
      on_sale
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
        featured: featured !== undefined ? String(featured) : undefined,
        on_sale: on_sale !== undefined ? String(on_sale) : undefined
      },
    });

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
