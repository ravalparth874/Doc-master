# SEO launch checklist

Everything in this file is designed for a brand new domain. Work through it once after
the first deploy, then re-check it every few months.

---

## 1. Before you start: technical basics

- [ ] `SITE_URL` is set to your real domain, with **no** trailing slash:
      `SITE_URL=https://docmaster.app`
- [ ] `https://your-domain.com/api/health` returns `"status":"ok"`.
- [ ] `View Source` on any tool page shows a unique `<title>`, a unique
      `<meta name="description">`, one `<link rel="canonical">` and one `<h1>`.
- [ ] The canonical URL contains your domain, not `https://docmaster.example`.
- [ ] `https://your-domain.com/robots.txt` exists and points at your sitemap.
- [ ] `https://your-domain.com/sitemap.xml` lists all 12 routes and returns HTTP 200.
- [ ] `https://your-domain.com/sitemap.xml` opens in
      [search.google.com/webmasters/tools/sitemap-tester](https://search.google.com/webmasters/tools/sitemap-tester)
      without errors.
- [ ] `https://your-domain.com/favicon.ico`, `/site.webmanifest` and
      `/android-chrome-512x512.png` all return 200.
- [ ] A tool page works with JavaScript disabled at least far enough to show the title,
      the heading and the explanatory text (pre-rendered HTML).
- [ ] HTTPS works and `http://` redirects to `https://` (Certbot `--redirect` does this).

---

## 2. Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. **Add property → Domain**. Enter `docmaster.app` (no protocol, no `www`).
3. **DNS verification**: Google gives you a `TXT` record. Add it at your DNS provider:

   | Type | Name | Value |
   | --- | --- | --- |
   | TXT | `@` | `google-site-verification=...` |

   Wait for propagation, then click **Verify**.
4. Once the domain property is verified, Google will discover the `URL-prefix` variants
   too. Optionally add `https://www.your-domain.com` as a **URL-prefix** property as well.
5. Open **Sitemaps** (`Sitemaps` menu) and submit:

   ```
   sitemap.xml
   ```

   Status should change to **Success**. Confirm the "Discovered URLs" count later, it
   should be 12.
6. Open **URL Inspection**, paste `https://your-domain.com` and press **Test live URL**.
7. Click **Request indexing** for the home page.
8. Repeat step 6-7 for each tool page:

   - `/merge-pdf`
   - `/split-pdf`
   - `/compress-pdf`
   - `/images-to-pdf`
   - `/pdf-to-images`
   - `/rotate-pdf`
   - `/protect-pdf`
   - `/about`, `/privacy`, `/terms`, `/contact`

   Requesting 12 URLs by hand is enough. Do not spam it: Google crawls the rest from the
   sitemap.

9. Use **Performance → Search results** after a week or two to see queries and clicks.
   If a page is not indexed, check **URL Inspection** for the reason (usually a canonical
   pointing somewhere unexpected).

---

## 3. Bing Webmaster Tools

1. Go to [bing.com/webmasters](https://www.bing.com/webmasters).
2. **Sign in** with a Microsoft or Google account.
3. **Add site** and import from Google Search Console (one click) or add manually.
4. Verify with the same options as Google (DNS, file or meta tag).
5. **Sitemaps → Submit sitemap** with `https://your-domain.com/sitemap.xml`.
6. Optional: **IndexNow** is supported - it notifies Bing the moment you deploy. The
   endpoint is `https://api.indexnow.org/indexnow?key=...`, send a POST with your URL
   after each deploy.
7. Check **Site Explorer → Index Status** in about a week.

---

## 4. Privacy-friendly analytics

Analytics is off until you set `ANALYTICS_ID`. Pick **one**.

### Plausible (recommended for a privacy-first site)

1. Create an account at [plausible.io](https://plausible.io) and add your domain.
2. Copy the site domain, for example `docmaster.app`, and set:
   ```
   ANALYTICS_ID=docmaster.app
   ```
3. Redeploy (or restart the container). The backend injects the script at serve time, so
   no frontend rebuild is needed.
4. Plausible stores no cookies and does not need a consent banner for most jurisdictions.

### Google Analytics 4

1. Create a property in [analytics.google.com](https://analytics.google.com).
2. Copy the **Measurement ID**, which looks like `G-XXXXXXXXXX`.
3. Set `ANALYTICS_ID=G-XXXXXXXXXX` and redeploy.
4. Note: with GA4 you should add a cookie/consent notice to your own policy, which the
   Privacy Policy page already describes honestly.

### Verify

Open any page with `View Source` and confirm the analytics `<script>` appears in the
`<head>`. Setting `ANALYTICS_ID=` (empty) removes it entirely.

---

## 5. Content and on-page checks

- [ ] Every tool page has 300+ words of visible text. The compress page ships with about
      1,400 words.
- [ ] Each tool page has a `How to use` section, a benefits section and 5 FAQs.
- [ ] `FAQPage` JSON-LD is present on the home page and on every tool page.
- [ ] `WebApplication` JSON-LD is present on the home page.
- [ ] `BreadcrumbList` JSON-LD is present on every tool page.
- [ ] Titles are keyword targeted and unique, for example
      `Merge PDF Online Free – No Signup | DOC Master`,
      `Compress PDF to 200KB Online Free | DOC Master`.
- [ ] Each page has exactly one `<h1>` and sensible `<h2>`/`<h3>` order.
- [ ] Open Graph tags render a preview:
      paste your page URL into <https://www.opengraph.xyz> or share it in a chat app.
- [ ] Add the site to your social profiles so the OG image (1200x630) is used.

---

## 6. Performance (Core Web Vitals)

- [ ] Test with [PageSpeed Insights](https://pagespeed.web.dev/) for mobile and desktop.
- [ ] Test with [web.dev/measure](https://web.dev/measure/) using a mobile connection.
- [ ] Confirm hashed assets are cached for a year (`Cache-Control: public, max-age=31536000, immutable`).
- [ ] Confirm Gzip is active (`Content-Encoding: gzip` in the response headers).
- [ ] Keep tool pages lazy loaded: only the current page's JavaScript is downloaded.
- [ ] Fonts are self hosted (`@fontsource-variable/inter`), so there is no third party
      request and no layout shift.

---

## 7. Ongoing

- [ ] Re-submit the sitemap after adding routes (`npm run generate:assets` then redeploy).
- [ ] Check Search Console **Coverage → Pages** monthly.
- [ ] Fix every "Page with redirect" or "Duplicate title" warning that appears.
- [ ] Answer questions in the Search Console **Messages** panel.
- [ ] Keep the Privacy Policy and Terms accurate when you change how the service works.