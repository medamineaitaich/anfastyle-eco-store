import { wooFetch } from "../_lib/woo.js";

const WISHLIST_META_KEY = "wishlist_product_ids";

function getWpBaseUrl() {
  const base = String(process.env.WP_URL || process.env.WC_URL || process.env.WOOCOMMERCE_URL || "")
    .replace(/\/$/, "")
    .replace(/\/wp-json\/wc\/v3$/i, "")
    .replace(/\/wp-json\/?$/i, "")
    .replace(/\/$/, "");
  if (!base) throw new Error("Store auth is not configured on the server.");
  return base;
}

function parseBody(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return null;
    }
  }
  return req.body || {};
}

function getBearerToken(req) {
  const header = String(req.headers?.authorization || req.headers?.Authorization || "").trim();
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

function decodeJwtPayloadSafely(token) {
  if (!token) return null;
  const parts = String(token).split(".");
  if (parts.length < 2 || !parts[1]) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function extractUserId(validateData) {
  const candidates = [
    validateData?.data?.user?.ID,
    validateData?.data?.user?.id,
    validateData?.data?.ID,
    validateData?.data?.id,
    validateData?.user?.ID,
    validateData?.user?.id,
    validateData?.ID,
    validateData?.id,
  ];
  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
}

function extractEmail(...sources) {
  for (const source of sources) {
    const email = String(
      source?.data?.user?.user_email ||
      source?.data?.user?.email ||
      source?.data?.user_email ||
      source?.data?.email ||
      source?.user?.user_email ||
      source?.user?.email ||
      source?.user_email ||
      source?.email ||
      source?.sub ||
      ""
    ).trim().toLowerCase();
    if (email.includes("@")) return email;
  }
  return "";
}

async function validateTokenRequest(authUrl, token) {
  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  const success =
    res.ok &&
    (data?.success === true || data?.data?.success === true || data?.data?.is_valid === true || data?.is_valid === true);

  const code = String(data?.code || data?.data?.code || "").toLowerCase();
  const message = String(data?.message || data?.data?.message || "").toLowerCase();
  const noRoute = res.status === 404 || code === "rest_no_route" || message.includes("no route was found");
  const invalidToken =
    !noRoute &&
    (res.status === 401 ||
      res.status === 403 ||
      code.includes("jwt") ||
      message.includes("invalid") ||
      message.includes("expired") ||
      message.includes("unauthorized"));

  return {
    valid: Boolean(success),
    invalidToken: Boolean(invalidToken),
    unavailable: Boolean(noRoute || res.status >= 500),
    data,
    status: res.status,
  };
}

function isJwtExpired(token) {
  const payload = decodeJwtPayloadSafely(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp) || exp <= 0) return false;
  return Math.floor(Date.now() / 1000) >= exp;
}

async function validateToken(base, token) {
  if (isJwtExpired(token)) {
    return { state: "invalid", data: {}, status: 401 };
  }

  const endpoints = [
    `${base}/?rest_route=/simple-jwt-login/v1/auth/validate`,
    `${base}/wp-json/simple-jwt-login/v1/auth/validate`,
  ];

  let sawUnavailable = false;
  let lastData = {};
  let lastStatus = 0;
  for (const endpoint of endpoints) {
    try {
      const result = await validateTokenRequest(endpoint, token);
      lastData = result.data || lastData;
      lastStatus = result.status || lastStatus;
      if (result.valid) return { state: "valid", data: result.data, status: result.status };
      if (result.invalidToken) return { state: "invalid", data: result.data, status: result.status };
      if (result.unavailable) sawUnavailable = true;
    } catch {
      sawUnavailable = true;
    }
  }

  if (sawUnavailable) {
    return { state: "unverified", data: lastData, status: lastStatus };
  }

  return { state: "unverified", data: lastData, status: lastStatus };
}

async function findCustomerByEmail(email) {
  if (!email) return null;
  const customers = await wooFetch("customers", {
    params: { email, per_page: 1 },
  });
  if (!Array.isArray(customers) || customers.length === 0) return null;
  return customers[0] || null;
}

async function resolveCustomer(token, validateData) {
  const validatedUserId = extractUserId(validateData);
  const validatedEmail = extractEmail(validateData);
  const jwtPayload = decodeJwtPayloadSafely(token);
  const payloadEmail = extractEmail(jwtPayload);
  const email = validatedEmail || payloadEmail;

  if (validatedUserId) {
    try {
      const customer = await wooFetch(`customers/${validatedUserId}`);
      if (customer?.id) return customer;
    } catch {
      // Fall back to email-based lookup if the validated id is not a Woo customer id.
    }
  }

  if (email) {
    const customer = await findCustomerByEmail(email);
    if (customer?.id) return customer;
  }

  return null;
}

function parseWishlistIds(rawValue) {
  if (Array.isArray(rawValue)) {
    return rawValue
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);
  }

  if (typeof rawValue === "string" && rawValue.trim()) {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v) => Number(v))
          .filter((v) => Number.isFinite(v) && v > 0);
      }
    } catch {
      // Ignore invalid JSON meta values.
    }
  }

  return [];
}

function uniqueIds(ids) {
  return Array.from(new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)));
}

function getWishlistFromCustomer(customer) {
  const metaData = Array.isArray(customer?.meta_data) ? customer.meta_data : [];
  const entry = metaData.find((item) => String(item?.key || "") === WISHLIST_META_KEY);
  return uniqueIds(parseWishlistIds(entry?.value));
}

async function saveWishlistForCustomer(customer, ids) {
  const metaData = Array.isArray(customer?.meta_data) ? customer.meta_data : [];
  const remainingMeta = metaData.filter((item) => String(item?.key || "") !== WISHLIST_META_KEY);
  const payloadMeta = [
    ...remainingMeta,
    {
      key: WISHLIST_META_KEY,
      value: JSON.stringify(uniqueIds(ids)),
    },
  ];

  const updated = await wooFetch(`customers/${customer.id}`, {
    method: "PUT",
    body: { meta_data: payloadMeta },
  });

  return getWishlistFromCustomer(updated);
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Please sign in to use wishlist." });
    }

    const base = getWpBaseUrl();
    const tokenValidation = await validateToken(base, token);
    if (tokenValidation.state === "invalid") {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }

    const customer = await resolveCustomer(token, tokenValidation.data);
    if (!customer?.id) {
      return res.status(404).json({ error: "Customer not found for this token." });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        source: "store-wishlist",
        wishlist: getWishlistFromCustomer(customer),
      });
    }

    const body = parseBody(req);
    if (!body) {
      return res.status(400).json({ error: "Invalid JSON body." });
    }

    const productId = Number(body.product_id);
    const action = String(body.action || "").trim().toLowerCase();
    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ error: "Invalid product_id." });
    }
    if (action !== "add" && action !== "remove") {
      return res.status(400).json({ error: "Invalid action. Use add or remove." });
    }

    const current = getWishlistFromCustomer(customer);
    const next =
      action === "add"
        ? uniqueIds([...current, productId])
        : current.filter((id) => id !== productId);

    const wishlist = await saveWishlistForCustomer(customer, next);
    return res.status(200).json({
      source: "store-wishlist",
      wishlist,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Wishlist request failed." });
  }
}
