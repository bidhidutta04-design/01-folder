# Morrow Coffee Co.

A responsive coffee shop storefront built with React and Vite. The catalog loads hot coffee menu items from the public SampleAPIs endpoint and falls back to a curated local catalog when the API is unavailable. Shopping bag contents persist in local storage.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; preview it locally with `npm run preview`.

## API integrations

- Product catalog: `https://api.sampleapis.com/coffee/hot` (public demo data; no API key).
- Checkout: set `VITE_CHECKOUT_API_URL` to your server-side checkout-session endpoint. The storefront sends item IDs and quantities as JSON with `POST` and expects a JSON response containing a hosted payment `url`.

The checkout endpoint must look up product prices itself and create the payment session using private server-side credentials. Never put payment secrets in a `VITE_` variable. The newsletter form currently confirms locally and needs a mailing-list API to persist subscriptions.

Copy `.env.example` to `.env.local` for local checkout integration. Set the same variable in your hosting provider's environment settings before building.

## Deploy to Netlify

The included `netlify.toml` configures `npm run build`, publishes `dist`, and enables SPA fallback routing. Import the repository in Netlify, then add `VITE_CHECKOUT_API_URL` under Site configuration → Environment variables when a checkout backend is ready. Netlify builds and publishes on each push.

This is a frontend storefront, not a complete payment backend. Catalog and cart work without secrets; real payments require the server-side checkout endpoint described above.
