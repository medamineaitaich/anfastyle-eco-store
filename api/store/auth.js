import { wooFetch } from "../_lib/woo.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

function getAction(req) {
  const queryAction = String(req.query?.action || "").trim().toLowerCase();
  if (queryAction) return queryAction;
  const path = String(req.url || "").split("?")[0];
  const parts = path.split("/").filter(Boolean);
  return String(parts[parts.length - 1] || "").trim().toLowerCase();
}

function decodeParam(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
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

async function getWpIndex(base) {
  const res = await fetch(`${base}/wp-json`);
  const text = await res.text();
  try {
    return JSON.parse(text) || {};
  } catch {
    return {};
  }
}

function detectAuthEndpoint(indexData, base) {
  const routes = indexData?.routes || {};
  if (routes["/jwt-auth/v1/token"]) return `${base}/wp-json/jwt-auth/v1/token`;
  if (routes["/simple-jwt-login/v1/auth"]) return `${base}/wp-json/simple-jwt-login/v1/auth`;
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

async function handleLogin(req, res, body) {
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

  const upstreamMessage = String(data?.message || "").slice(0, 200);
  const routeError = upstreamMessage.includes("No route was found matching the URL and request method.");

  if (routeError) {
    console.warn(`[auth/login] upstream=${wpRes.status} endpoint=${url} error="${upstreamMessage}"`);
    return res.status(500).json({ error: noRoutePluginError(url) });
  }

  if (!wpRes.ok) {
    console.warn(`[auth/login] upstream=${wpRes.status} endpoint=${url} error="${upstreamMessage || "invalid credentials"}"`);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = data?.token || data?.jwt;
  if (!token) {
    console.warn(`[auth/login] upstream=${wpRes.status} endpoint=${url} error="missing token in successful auth response"`);
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const me = await fetchMe(base, token);
  if (!me) {
    console.warn(`[auth/login] upstream=200 endpoint=${url} warning="token valid but /users/me unavailable"`);
  }

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
}

async function handleRegister(req, res, body) {
  const first_name = String(body.first_name || "").trim();
  const last_name = String(body.last_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const password2 = String(body.password2 || "");
  const phone = String(body.phone || "").trim();

  if (!email) return badRequest(res, "Email is required.");
  if (!EMAIL_RE.test(email)) return badRequest(res, "Please enter a valid email address.");
  if (!password) return badRequest(res, "Password is required.");
  if (!password2) return badRequest(res, "Password confirmation is required.");
  if (password !== password2) return badRequest(res, "Passwords do not match.");
  if (!PASSWORD_RE.test(password)) {
    return badRequest(res, "Password must be at least 6 characters.");
  }

  const emailLocalPart = email.split("@")[0] || "Customer";
  const fallbackName = emailLocalPart.charAt(0).toUpperCase() + emailLocalPart.slice(1);
  const resolvedFirstName = first_name || fallbackName;
  const resolvedLastName = last_name || "Customer";

  try {
    const created = await wooFetch("customers", {
      method: "POST",
      body: {
        email,
        username: makeUsername(email),
        password,
        first_name: resolvedFirstName,
        last_name: resolvedLastName,
        billing: {
          first_name: resolvedFirstName,
          last_name: resolvedLastName,
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
    return res.status(400).json({ error: friendlyWooError(e?.message || String(e)) });
  }
}

async function handleForgotPassword(req, res, body) {
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
}

async function handleResetPassword(req, res, body) {
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

    const action = getAction(req);
    if (action === "login") return await handleLogin(req, res, body);
    if (action === "register") return await handleRegister(req, res, body);
    if (action === "forgot-password") return await handleForgotPassword(req, res, body);
    if (action === "reset-password") return await handleResetPassword(req, res, body);

    return res.status(404).json({ error: "Unknown auth action." });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Auth request failed. Please try again." });
  }
}
