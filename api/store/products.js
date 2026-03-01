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

async function wooFetchWithHeaders(path, { method = "GET", params = {}, body } = {}) {
  const base = (process.env.WC_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("Missing WC_URL env var");
  if (!process.env.WC_KEY) throw new Error("Missing WC_KEY env var");
  if (!process.env.WC_SECRET) throw new Error("Missing WC_SECRET env var");

  const url = new URL(`${base}/wp-json/wc/v3/${path}`);
  url.searchParams.set("consumer_key", process.env.WC_KEY);
  url.searchParams.set("consumer_secret", process.env.WC_SECRET);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!res.ok) {
    throw new Error(`Woo API error ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }

  return { data, headers: res.headers };
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    const {
      page = "1",
      per_page = "12",
      search,
      category,
      sort = "newest",
      on_sale,
      status = "publish",
    } = req.query || {};

    let orderby = "date";
    let order = "desc";
    if (sort === "price_asc") {
      orderby = "price";
      order = "asc";
    } else if (sort === "price_desc") {
      orderby = "price";
      order = "desc";
    }

    const { data, headers } = await wooFetchWithHeaders("products", {
      params: {
        page,
        per_page,
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        orderby,
        order,
        on_sale: on_sale !== undefined ? String(on_sale) : undefined,
        status,
      },
    });
    const total = Number(headers.get("x-wp-total") || 0);
    const totalPages = Number(headers.get("x-wp-totalpages") || 0);
    const filtered = Array.isArray(data)
      ? data.filter((p) => ["simple", "variable"].includes(p.type))
      : [];

    res.status(200).json({
      source: "store-products",
      page: Number(page),
      per_page: Number(per_page),
      total,
      totalPages,
      items: filtered.map(cleanListItem),
    });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
