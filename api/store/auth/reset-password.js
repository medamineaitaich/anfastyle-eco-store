const PASSWORD_RE = /^.{6,}$/;

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

function decodeParam(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function extractInputValue(html, inputName) {
  const text = String(html || "");
  const direct = new RegExp(`name=["']${inputName}["'][^>]*value=["']([^"']*)["']`, "i").exec(text);
  if (direct?.[1] !== undefined) return direct[1];
  const reverse = new RegExp(`value=["']([^"']*)["'][^>]*name=["']${inputName}["']`, "i").exec(text);
  return reverse?.[1] ?? "";
}

function normalizeWpError(html) {
  const text = String(html || "");
  if (/invalid key|expired|invalid password reset link|key is no longer valid/i.test(text)) {
    return "This reset link is invalid or expired. Please request a new password reset email.";
  }
  if (/passwords do not match/i.test(text)) {
    return "Passwords do not match.";
  }
  if (/password is too weak|too short/i.test(text)) {
    return "Please choose a stronger password.";
  }
  return "Unable to reset password right now. Please try again.";
}

async function openResetPage(base, login, key) {
  const url = new URL(`${base}/wp-login.php`);
  url.searchParams.set("action", "rp");
  url.searchParams.set("key", key);
  url.searchParams.set("login", login);

  const res = await fetch(url.toString(), { method: "GET", redirect: "manual" });
  const html = await res.text();
  const cookie = res.headers.get("set-cookie") || "";

  if (!res.ok) {
    throw new Error(normalizeWpError(html));
  }

  const rpLogin = extractInputValue(html, "rp_login");
  const rpKey = extractInputValue(html, "rp_key");
  const nonce = extractInputValue(html, "wp-resetpass-nonce");

  if (!rpLogin || !rpKey) {
    throw new Error(normalizeWpError(html));
  }

  return { rpLogin, rpKey, nonce, cookie };
}

async function submitNewPassword(base, state, password) {
  const params = new URLSearchParams();
  params.set("rp_login", state.rpLogin);
  params.set("rp_key", state.rpKey);
  params.set("pass1", password);
  params.set("pass2", password);
  params.set("wp-submit", "Save Password");
  if (state.nonce) {
    params.set("wp-resetpass-nonce", state.nonce);
  }

  const res = await fetch(`${base}/wp-login.php?action=resetpass`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(state.cookie ? { Cookie: state.cookie } : {}),
    },
    body: params.toString(),
    redirect: "manual",
  });

  const html = await res.text();
  const location = res.headers.get("location") || "";
  const redirectSuccess = /checkemail=confirm|checkemail=changed|action=login/i.test(location);
  const bodySuccess = /password has been reset|password reset complete|your password has been reset/i.test(html);

  if (redirectSuccess || bodySuccess) {
    return;
  }

  throw new Error(normalizeWpError(html));
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

    const key = decodeParam(body.key || body.rp_key).trim();
    const login = decodeParam(body.login || body.rp_login).trim();
    const password = String(body.password || "");
    const password2 = String(body.password2 || "");

    if (!key) return badRequest(res, "Reset key is required.");
    if (!login) return badRequest(res, "Login is required.");
    if (!password) return badRequest(res, "Password is required.");
    if (!password2) return badRequest(res, "Password confirmation is required.");
    if (password !== password2) return badRequest(res, "Passwords do not match.");
    if (!PASSWORD_RE.test(password)) return badRequest(res, "Password must be at least 6 characters.");

    const base = getBaseUrl();
    const state = await openResetPage(base, login, key);
    await submitNewPassword(base, state, password);

    return res.status(200).json({
      source: "store-auth-reset-password",
      message: "Your password has been reset. You can now sign in.",
    });
  } catch (e) {
    const msg = e?.message || "Unable to reset password right now. Please try again.";
    return res.status(400).json({ error: msg });
  }
}
