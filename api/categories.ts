import type { VercelRequest, VercelResponse } from "@vercel/node";
import { wooFetch } from "./_lib/woo";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { per_page = "100", page = "1", hide_empty = "true" } = req.query;

    const data = await wooFetch("products/categories", {
      params: {
        per_page: String(per_page),
        page: String(page),
        hide_empty: String(hide_empty),
      },
    });

    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
