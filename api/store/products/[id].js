import { wooFetch } from "../../_lib/woo.js";

function cleanProduct(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    type: p.type,
    description: p.description,
    short_description: p.short_description,
    price: p.price,
    regular_price: p.regular_price,
    sale_price: p.sale_price,
    on_sale: p.on_sale,
    stock_status: p.stock_status,
    stock_quantity: p.stock_quantity,
    sku: p.sku,
    images: (p.images || []).map((img) => ({
      id: img.id,
      src: img.src,
      thumbnail: img.thumbnail || img.src,
      alt: img.alt || "",
    })),
    categories: (p.categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
  };
}

function cleanVariation(v) {
  return {
    id: v.id,
    price: v.price,
    regular_price: v.regular_price,
    sale_price: v.sale_price,
    on_sale: v.on_sale,
    stock_status: v.stock_status,
    stock_quantity: v.stock_quantity,
    sku: v.sku,
    attributes: v.attributes || [],
    image: v.image ? { id: v.image.id, src: v.image.src, alt: v.image.alt || "" } : null,
  };
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: "Missing product id" });

    const raw = await wooFetch(`products/${id}`);
    const product = cleanProduct(raw);

    let variations = [];
    if (raw.type === "variable") {
      const rawVars = await wooFetch(`products/${id}/variations`, { params: { per_page: "100", page: "1" } });
      variations = rawVars.map(cleanVariation);
    }

    // IMPORTANT: marker so we know this endpoint is used
    res.status(200).json({ source: "store-endpoint", product, variations });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
}
