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

async function getWpIndex(base) {
  const res = await fetch(`${base}/wp-json`);
  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  return data || {};
}

function detectAuthEndpoint(indexData, base) {
  const routes = indexData?.routes || {};
  const hasJwtTokenRoute = Boolean(routes["/jwt-auth/v1/token"]);
  const hasSimpleJwtAuthRoute = Boolean(routes["/simple-jwt-login/v1/auth"]);

  if (hasJwtTokenRoute) return `${base}/wp-json/jwt-auth/v1/token`;
  if (hasSimpleJwtAuthRoute) return `${base}/wp-json/simple-jwt-login/v1/auth`;
  return `${base}/wp-json/jwt-auth/v1/token`;
}

async function fetchMe(base, token) {
  if (!token) return null;
  const res = await fetch(`${base}/wp-json/wp/v2/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function noRoutePluginError(authUrl) {
  return `WordPress auth endpoint is missing. Install/enable a JWT plugin exposing POST ${authUrl}.`;
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
    const wpIndex = await getWpIndex(base);
    const url = detectAuthEndpoint(wpIndex, base);

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
      const routeError = String(data?.message || "").includes("No route was found matching the URL and request method.");
      if (routeError) {
        return res.status(500).json({ error: noRoutePluginError(url) });
      }
      return res.status(401).json({ error: parseWpError(wpRes.status, data, "Login failed.") });
    }

    const token = data?.token || data?.jwt;
    const me = await fetchMe(base, token);

    return res.status(200).json({
      source: "store-auth-login",
      token,
      user: {
        id: me?.id ?? data?.user_id,
        email: me?.email ?? data?.user_email,
        first_name: me?.first_name ?? "",
        last_name: me?.last_name ?? "",
      },
      message: "Login successful.",
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unable to sign in right now. Please try again." });
  }
}
