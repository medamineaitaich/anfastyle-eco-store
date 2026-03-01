import { wooFetch } from "../../_lib/woo.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function badRequest(res, error) {
  return res.status(400).json({ error });
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

function makeUsername(email) {
  const base = String(email || "").split("@")[0] || "user";
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase() || "user";
  return `${safe}_${Date.now()}`;
}

function friendlyWooError(message) {
  const text = String(message || "");
  if (text.includes("registration-error-email-exists") || text.toLowerCase().includes("already registered") || text.toLowerCase().includes("already exists")) {
    return "An account with this email already exists.";
  }
  if (text.includes("Missing WC_") || text.includes("Missing WC_URL")) {
    return "Store auth is not configured on the server.";
  }
  return "Unable to create account right now. Please try again.";
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = parseBody(req);
    if (!body) {
      return badRequest(res, "Invalid JSON body.");
    }

    const first_name = String(body.first_name || "").trim();
    const last_name = String(body.last_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const password2 = String(body.password2 || "");
    const phone = String(body.phone || "").trim();

    if (!first_name) return badRequest(res, "First name is required.");
    if (!last_name) return badRequest(res, "Last name is required.");
    if (!email) return badRequest(res, "Email is required.");
    if (!EMAIL_RE.test(email)) return badRequest(res, "Please enter a valid email address.");
    if (!password) return badRequest(res, "Password is required.");
    if (!password2) return badRequest(res, "Password confirmation is required.");
    if (password !== password2) return badRequest(res, "Passwords do not match.");
    if (!STRONG_PASSWORD_RE.test(password)) {
      return badRequest(res, "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
    }

    const created = await wooFetch("customers", {
      method: "POST",
      body: {
        email,
        username: makeUsername(email),
        password,
        first_name,
        last_name,
        billing: {
          first_name,
          last_name,
          email,
          phone,
        },
      },
    });

    return res.status(200).json({
      source: "store-auth-register",
      user: {
        id: created?.id,
        email: created?.email,
        first_name: created?.first_name,
        last_name: created?.last_name,
      },
      message: "Account created successfully.",
    });
  } catch (e) {
    const msg = e?.message || String(e);
    return res.status(400).json({ error: friendlyWooError(msg) });
  }
}
