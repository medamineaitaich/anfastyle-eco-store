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
  const base = (process.env.WC_URL || process.env.WOOCOMMERCE_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("Store auth is not configured on the server.");
  return base;
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
    if (!email) return badRequest(res, "Email is required.");
    if (!EMAIL_RE.test(email)) return badRequest(res, "Please enter a valid email address.");

    const base = getBaseUrl();
    const params = new URLSearchParams();
    params.set("user_login", email);
    params.set("redirect_to", "");
    params.set("wp-submit", "Get New Password");

    const wpRes = await fetch(`${base}/wp-login.php?action=lostpassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      redirect: "manual",
    });

    if (!wpRes.ok && wpRes.status !== 302) {
      const upstream = (await wpRes.text()).slice(0, 200);
      console.warn(`[auth/forgot-password] upstream=${wpRes.status} error="${upstream}"`);
      return res.status(500).json({ error: "Unable to request password reset right now. Please try again." });
    }

    return res.status(200).json({
      source: "store-auth-forgot-password",
      message: "If this email exists, a password reset link has been sent.",
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unable to request password reset right now. Please try again." });
  }
}
