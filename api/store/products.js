import { wooFetch } from "../_lib/woo.js";

function cleanListItem(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    price: p.price,
    regular_price: p.regular_price,
    sale_price: p.sale_price,
    on_sale: p.on_sale,
    stock_status: p.stock_status,
    categories: (p.categories || []).map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    image: p.images?.[0]
      ? { src: p.images[0].src, thumbnail: p.images[0].thumbnail || p.images[0].src, alt: p.images[0].alt || "" }
      : null,
  };
}

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

    res.status(200).json({
      source: "store-products",
      page: Number(page),
      per_page: Number(per_page),
      items: Array.isArray(data) ? data.map(cleanListItem) : [],
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
