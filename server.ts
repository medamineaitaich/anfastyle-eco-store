import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

type WooProduct = {
  id: number;
  name: string;
  price?: string;
  images?: Array<{ src?: string }>;
  categories?: Array<{ name?: string }>;
  short_description?: string;
  description?: string;
};

function normalizeStoreUrl(url: string) {
  return url.replace(/\/+$/, "");
}

async function fetchAllWooProducts(url: string, key: string, secret: string) {
  const baseUrl = normalizeStoreUrl(url);
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const perPage = 100;
  let page = 1;
  let totalPages = 1;
  const allProducts: WooProduct[] = [];

  while (page <= totalPages) {
    const endpoint = `${baseUrl}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`;
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error (${response.status}): ${response.statusText}`);
    }

    const products = (await response.json()) as WooProduct[];
    allProducts.push(...products);

    const totalPagesHeader = response.headers.get("x-wp-totalpages");
    const parsedTotalPages = Number(totalPagesHeader ?? "1");
    totalPages = Number.isFinite(parsedTotalPages) && parsedTotalPages > 0 ? parsedTotalPages : 1;
    page += 1;
  }

  return allProducts;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/products", async (req, res) => {
    try {
      const url = process.env.WOOCOMMERCE_URL;
      const key = process.env.WOOCOMMERCE_KEY;
      const secret = process.env.WOOCOMMERCE_SECRET;

      if (!url || !key || !secret) {
        // Return 404 or empty if not configured so the frontend knows to use mock data
        return res.status(404).json({ error: "WooCommerce not configured" });
      }

      const wcProducts = await fetchAllWooProducts(url, key, secret);
      
      // Map WC products to our Product interface
      const mappedProducts = wcProducts.map((p) => ({
        id: p.id.toString(),
        name: p.name,
        price: parseFloat(p.price || "0"),
        image: p.images?.[0]?.src || "https://picsum.photos/seed/placeholder/600/800",
        category: p.categories?.[0]?.name || "Uncategorized",
        description: p.short_description?.replace(/<[^>]*>?/gm, "") || p.description?.replace(/<[^>]*>?/gm, "") || "",
        colors: ["#485e2c", "#354730", "#000000", "#ffffff"], // Mocking colors for now, could be mapped from attributes
        sizes: ["S", "M", "L", "XL"], // Mocking sizes for now
      }));

      res.json({ products: mappedProducts });
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
