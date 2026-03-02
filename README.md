<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/860ef45c-582a-4940-8511-f287e227b49d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set your WooCommerce REST credentials:
   `WOOCOMMERCE_URL`, `WOOCOMMERCE_KEY`, `WOOCOMMERCE_SECRET`
3. (Optional) Set `GEMINI_API_KEY` in `.env.local` if your app uses Gemini features
4. Run the app:
   `npm run dev`

## WooCommerce Headless Notes

- Customer account creation uses `POST /api/store/auth/register` and creates WooCommerce customers directly in WordPress.
- Customer sign-in uses `POST /api/store/auth/login` and requires a WordPress JWT auth plugin endpoint.
- Password reset requests use `POST /api/store/auth/forgot-password`, which triggers WordPress lost-password email delivery.
- Password reset submission uses `POST /api/store/auth/reset-password` and applies a new password through the WordPress reset key/login flow.
- Generate API keys in WooCommerce admin: `WooCommerce -> Settings -> Advanced -> REST API`.
- Use a full site URL in `WOOCOMMERCE_URL` (for example: `https://your-store.com`).
- The backend route `GET /api/products` now fetches all published products using WooCommerce pagination and returns them to the React frontend.
- Refresh tip: after pushing changes, trigger a redeploy and hard refresh the browser to see the latest build.

## WordPress Filter For Branded Reset Links

To make reset emails open your storefront page (`/reset-password`) instead of `wp-login.php`, add this snippet in WordPress (`functions.php` or a small custom plugin):

```php
add_filter('retrieve_password_message', function ($message, $key, $user_login, $user_data) {
    $frontend = 'https://www.anfastyles.shop/reset-password';
    $url = add_query_arg([
        'key' => rawurlencode($key),
        'login' => rawurlencode($user_login),
    ], $frontend);

    return "Hi,\n\nClick here to reset your password:\n{$url}\n\nIf you did not request this, ignore this email.";
}, 10, 4);
```
