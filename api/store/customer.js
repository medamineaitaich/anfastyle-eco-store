import { wooFetch } from "../_lib/woo.js";

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

function normalizeWpBase(rawBase) {
  return String(rawBase || "")
    .replace(/\/$/, "")
    .replace(/\/wp-json\/wc\/v3$/i, "")
    .replace(/\/wp-json\/?$/i, "")
    .replace(/\/$/, "");
}

function getWpBaseUrl() {
  const raw = process.env.WP_URL || process.env.WC_URL || process.env.WOOCOMMERCE_URL || "";
  const base = normalizeWpBase(raw);
  if (!base) throw new Error("Store auth is not configured on the server.");
  return base;
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

async function validateTokenRequest(url, token) {
  const res = await fetch(url, {
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

  const valid =
    res.ok &&
    (data?.success === true || data?.data?.success === true || data?.data?.is_valid === true || data?.is_valid === true);

  return { valid: Boolean(valid), data, status: res.status };
}

async function validateToken(base, token) {
  const endpoints = [
    `${base}/?rest_route=/simple-jwt-login/v1/auth/validate`,
    `${base}/wp-json/simple-jwt-login/v1/auth/validate`,
  ];

  let last = { valid: false, data: {}, status: 0 };
  for (const endpoint of endpoints) {
    try {
      last = await validateTokenRequest(endpoint, token);
      if (last.valid) return last;
    } catch {
      // Try next endpoint.
    }
  }
  return last;
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
      // Continue with email lookup.
    }
  }

  if (email) {
    const customer = await findCustomerByEmail(email);
    if (customer?.id) return customer;
  }

  return null;
}

function toString(value) {
  return String(value ?? "").trim();
}

function normalizeCustomer(customer) {
  const billing = customer?.billing || {};
  const shipping = customer?.shipping || {};

  return {
    id: customer?.id ?? null,
    email: toString(customer?.email),
    first_name: toString(customer?.first_name),
    last_name: toString(customer?.last_name),
    billing: {
      phone: toString(billing?.phone),
      address_1: toString(billing?.address_1),
      city: toString(billing?.city),
      postcode: toString(billing?.postcode),
      country: toString(billing?.country).toUpperCase(),
      state: toString(billing?.state),
    },
    shipping: {
      address_1: toString(shipping?.address_1),
      city: toString(shipping?.city),
      postcode: toString(shipping?.postcode),
      country: toString(shipping?.country).toUpperCase(),
      state: toString(shipping?.state),
    },
  };
}

function pickAddressPayload(raw, type) {
  if (!raw || typeof raw !== "object") return undefined;

  const common = {
    first_name: toString(raw.first_name),
    last_name: toString(raw.last_name),
    address_1: toString(raw.address_1),
    city: toString(raw.city),
    postcode: toString(raw.postcode),
    country: toString(raw.country).toUpperCase(),
    state: toString(raw.state),
  };

  const payload =
    type === "billing"
      ? {
          ...common,
          email: toString(raw.email),
          phone: toString(raw.phone),
        }
      : common;

  if (!Object.values(payload).some(Boolean)) return undefined;
  return payload;
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET" && req.method !== "PUT") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Please sign in to continue." });
    }

    const base = getWpBaseUrl();
    const tokenValidation = await validateToken(base, token);
    if (!tokenValidation.valid) {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }

    const customer = await resolveCustomer(token, tokenValidation.data);
    if (!customer?.id) {
      return res.status(404).json({ error: "Customer profile not found." });
    }

    if (req.method === "GET") {
      return res.status(200).json({
        source: "store-customer",
        user: normalizeCustomer(customer),
      });
    }

    const body = parseBody(req);
    if (!body) {
      return res.status(400).json({ error: "Invalid JSON body." });
    }

    const first_name = toString(body.first_name);
    const last_name = toString(body.last_name);
    const email = toString(body.email).toLowerCase();
    const billing = pickAddressPayload(body.billing, "billing");
    const shipping = pickAddressPayload(body.shipping, "shipping");

    const payload = {};
    if (first_name) payload.first_name = first_name;
    if (last_name) payload.last_name = last_name;
    if (email) payload.email = email;
    if (billing) payload.billing = billing;
    if (shipping) payload.shipping = shipping;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: "No profile fields to update." });
    }

    const updated = await wooFetch(`customers/${customer.id}`, {
      method: "PUT",
      body: payload,
    });

    return res.status(200).json({
      source: "store-customer",
      user: normalizeCustomer(updated),
      message: "Profile updated successfully.",
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Customer request failed." });
  }
}
