import { wooFetch } from "../_lib/woo.js";

function badRequest(res, error) {
  return res.status(400).json({ error });
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const notes = body.notes;

    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "address_1",
      "city",
      "country",
      "postcode",
    ];

    for (const field of requiredFields) {
      if (!String(customer[field] || "").trim()) {
        return badRequest(res, `Missing required field: customer.${field}`);
      }
    }

    if (items.length === 0) {
      return badRequest(res, "Missing required field: items");
    }

    const line_items = [];
    for (const [index, item] of items.entries()) {
      const product_id = Number(item?.product_id);
      const quantity = Number(item?.quantity);
      const variation_id = item?.variation_id !== undefined ? Number(item.variation_id) : undefined;

      if (!Number.isFinite(product_id) || product_id <= 0) {
        return badRequest(res, `Invalid items[${index}].product_id`);
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return badRequest(res, `Invalid items[${index}].quantity`);
      }

      line_items.push({
        product_id,
        quantity,
        variation_id: Number.isFinite(variation_id) && variation_id > 0 ? variation_id : undefined,
      });
    }

    const payload = {
      payment_method: "cod",
      payment_method_title: "Cash on delivery",
      set_paid: false,
      billing: {
        first_name: String(customer.first_name || ""),
        last_name: String(customer.last_name || ""),
        email: String(customer.email || ""),
        phone: String(customer.phone || ""),
        address_1: String(customer.address_1 || ""),
        city: String(customer.city || ""),
        country: String(customer.country || ""),
        postcode: String(customer.postcode || ""),
      },
      shipping: {
        first_name: String(customer.first_name || ""),
        last_name: String(customer.last_name || ""),
        address_1: String(customer.address_1 || ""),
        city: String(customer.city || ""),
        country: String(customer.country || ""),
        postcode: String(customer.postcode || ""),
      },
      line_items,
      customer_note: notes ? String(notes) : undefined,
    };

    const order = await wooFetch("orders", { method: "POST", body: payload });
    return res.status(200).json({
      source: "store-checkout",
      order: {
        id: order?.id,
        status: order?.status,
        total: order?.total,
        currency: order?.currency,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
