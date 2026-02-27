import type { VercelRequest, VercelResponse } from "@vercel/node";
import { wooFetch } from "./_lib/woo";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      page = "1",
      per_page = "12",
      search,
      category,
      orderby = "date",
      order = "desc",
      status = "publish",
    } = req.query;

    const data = await wooFetch("products", {
      params: {
        page: String(page),
        per_page: String(per_page),
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        orderby: String(orderby),
        order: String(order),
        status: String(status),
      },
    });

    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
