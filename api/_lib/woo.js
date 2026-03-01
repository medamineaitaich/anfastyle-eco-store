export async function wooFetch(path, { method = "GET", params = {}, body } = {}) {
  const base = (process.env.WC_URL || process.env.WOOCOMMERCE_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("Missing WC_URL env var");
  const key = process.env.WC_KEY || process.env.WOOCOMMERCE_KEY;
  const secret = process.env.WC_SECRET || process.env.WOOCOMMERCE_SECRET;
  if (!key) throw new Error("Missing WC_KEY env var");
  if (!secret) throw new Error("Missing WC_SECRET env var");

  const url = new URL(`${base}/wp-json/wc/v3/${path}`);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);

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
  return data;
}
