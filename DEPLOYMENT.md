# Deployment Notes

Canonical domain: **https://sunsynergycontracts.com.my** (apex, no `www`).

The site already canonicalises everything to the apex domain in code:
- `astro.config.mjs` sets `site: 'https://sunsynergycontracts.com.my'`
- All `<link rel="canonical">`, `og:url`, sitemap entries, and schema URLs are built against the apex.

The one piece that must be configured at the host (it cannot be done reliably from
this repo, because `_redirects` matches request paths, not hostnames) is the
**`www` -> apex redirect**.

## Set up the www -> apex 301 redirect (Cloudflare)

1. In the Cloudflare dashboard, open the zone for `sunsynergycontracts.com.my`.
2. **DNS** -> ensure a record exists for `www` (a CNAME to the apex / Pages target),
   proxied (orange cloud) so Cloudflare can act on the request.
3. **Rules -> Redirect Rules -> Create rule**:
   - **Name:** `www to apex`
   - **When incoming requests match:** `Hostname` `equals` `www.sunsynergycontracts.com.my`
   - **Then:**
     - Type: **Dynamic**
     - Expression: `concat("https://sunsynergycontracts.com.my", http.request.uri.path)`
     - Status code: **301**
     - Preserve query string: **on**
4. Deploy the rule and verify:

   ```sh
   curl -sI https://www.sunsynergycontracts.com.my/services | grep -i "location\|HTTP"
   # expect: HTTP/2 301  +  location: https://sunsynergycontracts.com.my/services
   ```

If the site is hosted on Cloudflare **Pages**, an alternative is to add `www` as a
custom domain on the Pages project and let Pages issue the redirect, but an explicit
Redirect Rule is the most predictable.
