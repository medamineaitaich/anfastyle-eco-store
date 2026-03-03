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
    valid: Boolean(valid),
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

  if (sawUnavailable) return { state: "unverified", data: lastData, status: lastStatus };
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

  if (email) {
    const customer = await findCustomerByEmail(email);
    if (customer?.id) return customer;
  }

  if (validatedUserId) {
    try {
      const customer = await wooFetch(`customers/${validatedUserId}`);
      if (!customer?.id) return null;
      const customerEmail = String(customer?.email || "").trim().toLowerCase();
      if (email && customerEmail && customerEmail !== email) return null;
      return customer;
    } catch {
      return null;
    }
  }

  return null;
}

function toString(value) {
  return String(value ?? "").trim();
}

function asNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function extractTrackingNumber(order) {
  const meta = Array.isArray(order?.meta_data) ? order.meta_data : [];
  const directKeys = ["_tracking_number", "tracking_number", "_wc_shipment_tracking_number"];

  for (const item of meta) {
    const key = String(item?.key || "");
    const value = item?.value;
    if (directKeys.includes(key) && toString(value)) {
      return toString(value);
    }

    if (key === "_wc_shipment_tracking_items" && Array.isArray(value) && value.length > 0) {
      const first = value[0] || {};
      if (toString(first?.tracking_number)) return toString(first.tracking_number);
      if (toString(first?.tracking_id)) return toString(first.tracking_id);
    }
  }

  return "";
}

function mapLineItems(order) {
  const lineItems = Array.isArray(order?.line_items) ? order.line_items : [];
  return lineItems.map((item) => {
    const meta = Array.isArray(item?.meta_data) ? item.meta_data : [];
    const sizeMeta = meta.find((m) => String(m?.key || "").toLowerCase().includes("size"));
    const colorMeta = meta.find((m) => String(m?.key || "").toLowerCase().includes("color"));

    return {
      id: String(item?.id ?? ""),
      productId: String(item?.product_id ?? ""),
      variationId: Number(item?.variation_id || 0) || undefined,
      name: toString(item?.name),
      quantity: asNumber(item?.quantity || 0),
      total: asNumber(item?.total || 0),
      image: item?.image?.src ? String(item.image.src) : "",
      size: toString(sizeMeta?.value),
      color: toString(colorMeta?.value),
    };
  });
}

function normalizeOrderStatus(rawStatus) {
  return toString(rawStatus).toLowerCase() || "pending";
}

function canRefundOrder(order) {
  const status = normalizeOrderStatus(order?.status);
  const refundableStatuses = new Set(["processing", "completed", "on-hold"]);
  if (!refundableStatuses.has(status)) return false;
  const total = asNumber(order?.total);
  const refunded = asNumber(order?.total_refunded);
  return total - refunded > 0;
}

function mapOrder(order) {
  const total = asNumber(order?.total);
  const refunded = asNumber(order?.total_refunded);
  const refundableAmount = Math.max(total - refunded, 0);

  return {
    id: String(order?.id ?? ""),
    status: normalizeOrderStatus(order?.status),
    date: toString(order?.date_created || order?.date_created_gmt),
    total,
    currency: toString(order?.currency || "USD"),
    trackingNumber: extractTrackingNumber(order),
    totalRefunded: refunded,
    refundableAmount,
    canRefund: canRefundOrder(order),
    items: mapLineItems(order),
  };
}

function assertOrderOwnership(order, customer) {
  const orderCustomerId = Number(order?.customer_id || 0);
  const customerId = Number(customer?.id || 0);
  if (orderCustomerId > 0 && customerId > 0) {
    return orderCustomerId === customerId;
  }

  const orderEmail = toString(order?.billing?.email).toLowerCase();
  const customerEmail = toString(customer?.email).toLowerCase();
  return !!orderEmail && !!customerEmail && orderEmail === customerEmail;
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Please sign in to continue." });
    }

    const base = getWpBaseUrl();
    const tokenValidation = await validateToken(base, token);
    if (tokenValidation.state === "invalid") {
      return res.status(401).json({ error: "Your session has expired. Please sign in again." });
    }

    const customer = await resolveCustomer(token, tokenValidation.data);
    if (!customer?.id) {
      return res.status(404).json({ error: "Customer profile not found." });
    }

    if (req.method === "GET") {
      const orders = await wooFetch("orders", {
        params: {
          customer: customer.id,
          orderby: "date",
          order: "desc",
          per_page: 50,
        },
      });

      const mapped = Array.isArray(orders) ? orders.map(mapOrder) : [];
      return res.status(200).json({
        source: "store-orders",
        orders: mapped,
      });
    }

    const body = parseBody(req);
    if (!body) {
      return res.status(400).json({ error: "Invalid JSON body." });
    }

    const orderId = Number(body.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Invalid order ID." });
    }

    const order = await wooFetch(`orders/${orderId}`);
    if (!order?.id) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (!assertOrderOwnership(order, customer)) {
      return res.status(403).json({ error: "You cannot request a refund for this order." });
    }

    if (!canRefundOrder(order)) {
      return res.status(400).json({ error: "This order is not eligible for refund." });
    }

    const reason = toString(body.reason || "Customer refund request");
    const refundableAmount = Math.max(asNumber(order?.total) - asNumber(order?.total_refunded), 0);
    const requestedAmount = body.amount === undefined || body.amount === null ? refundableAmount : asNumber(body.amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ error: "Refund amount must be greater than zero." });
    }
    if (requestedAmount > refundableAmount) {
      return res.status(400).json({ error: "Refund amount exceeds the refundable total." });
    }

    const refund = await wooFetch(`orders/${orderId}/refunds`, {
      method: "POST",
      body: {
        reason,
        amount: requestedAmount.toFixed(2),
        api_refund: false,
      },
    });

    const refreshedOrder = await wooFetch(`orders/${orderId}`);
    return res.status(200).json({
      source: "store-orders",
      message: "Refund created successfully.",
      refund: {
        id: refund?.id ?? null,
      },
      order: mapOrder(refreshedOrder),
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Orders request failed." });
  }
}
