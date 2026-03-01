const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function getBaseUrl() {
  const base = (process.env.WC_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("Store auth is not configured on the server.");
  return base;
}

function parseWpError(status, data, fallback) {
  const msg = typeof data === "object" && data?.message ? String(data.message) : fallback;
  if (status === 403 || status === 401) return "Invalid email/username or password.";
  return msg || "Unable to sign in right now. Please try again.";
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

    const email = String(body.email || "").trim().toLowerCase();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const loginName = username || email;

    if (!loginName) return badRequest(res, "Email or username is required.");
    if (email && !EMAIL_RE.test(email)) return badRequest(res, "Please enter a valid email address.");
    if (!password) return badRequest(res, "Password is required.");

    const base = getBaseUrl();
    const url = `${base}/wp-json/jwt-auth/v1/token`;

    const wpRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: loginName, password }),
    });

    const text = await wpRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!wpRes.ok) {
      return res.status(401).json({ error: parseWpError(wpRes.status, data, "Login failed.") });
    }

    return res.status(200).json({
      source: "store-auth-login",
      token: data?.token,
      user: {
        id: data?.user_id,
        email: data?.user_email,
        nicename: data?.user_nicename,
        display_name: data?.user_display_name,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unable to sign in right now. Please try again." });
  }
}
