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

function extractLostPasswordNonce(html) {
  const match = String(html || "").match(/name=["']woocommerce-lost-password-nonce["']\s+value=["']([^"']+)["']/i);
  return match?.[1] || "";
}

async function requestWooReset(base, email) {
  const lostPasswordPath = "/my-account/lost-password/";
  const lostPasswordUrl = `${base}${lostPasswordPath}`;

  const pageRes = await fetch(lostPasswordUrl, { method: "GET" });
  const pageHtml = await pageRes.text();
  if (!pageRes.ok) {
    throw new Error(`Unable to open Woo lost password page (status ${pageRes.status}).`);
  }

  const nonce = extractLostPasswordNonce(pageHtml);
  if (!nonce) {
    throw new Error("Missing Woo lost password nonce.");
  }

  const params = new URLSearchParams();
  params.set("user_login", email);
  params.set("wc_reset_password", "Reset password");
  params.set("woocommerce-lost-password-nonce", nonce);
  params.set("_wp_http_referer", lostPasswordPath);

  const resetRes = await fetch(lostPasswordUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    redirect: "manual",
  });

  if (resetRes.status === 302 || resetRes.status === 303) {
    return;
  }

  const resetHtml = await resetRes.text();
  const looksSuccessful = resetRes.ok && /password reset email has been sent|check your email for the confirmation link/i.test(resetHtml);
  if (!looksSuccessful) {
    throw new Error(`Woo reset request failed (status ${resetRes.status}).`);
  }
}

async function requestWpReset(base, email) {
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
    throw new Error(`wp-login fallback failed (${wpRes.status}): ${upstream}`);
  }
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
    try {
      await requestWooReset(base, email);
    } catch (wooErr) {
      try {
        await requestWpReset(base, email);
      } catch (wpErr) {
        console.warn(`[auth/forgot-password] woo="${wooErr?.message || wooErr}" wp="${wpErr?.message || wpErr}"`);
        return res.status(500).json({ error: "Unable to request password reset right now. Please try again." });
      }
    }

    return res.status(200).json({
      source: "store-auth-forgot-password",
      message: "If this email exists, a password reset link has been sent.",
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unable to request password reset right now. Please try again." });
  }
}
