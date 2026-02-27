export async function wooFetch(path, { method = "GET", params = {}, body } = {}) {
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
  return data;
}
