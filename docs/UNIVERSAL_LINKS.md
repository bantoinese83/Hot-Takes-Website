# Universal links (`hottakedate.com/join`)

When someone taps `https://hottakedate.com/join?ref=CODE`, iOS can open **Hot Take** (`com.hottakes.app`) instead of Safari — if three pieces are configured.

## What you are setting up

| Piece | Who | What |
|-------|-----|------|
| **AASA file** | Your website | JSON on the domain that says “this URL path belongs to this app” |
| **Associated Domains** | Apple + Xcode | App entitlement `applinks:hottakedate.com` |
| **App handler** | iOS app | `onOpenURL` / `ReferralDeepLink` (already in Hot Take) |

Apple’s crawler downloads:

- `https://hottakedate.com/apple-app-site-association`
- `https://hottakedate.com/.well-known/apple-app-site-association`

Both are in this repo under `public/`.

## 1. Host the file (this website)

Files are already in:

- `public/apple-app-site-association`
- `public/.well-known/apple-app-site-association`

`vercel.json` sets `Content-Type: application/json` for those paths.

**Deploy** the site (e.g. push to main on Vercel). Then verify in a browser or terminal:

```bash
curl -sI https://hottakedate.com/.well-known/apple-app-site-association
curl -s https://hottakedate.com/.well-known/apple-app-site-association | head
```

You want **HTTP 200**, body is JSON (not HTML from the SPA), and no redirect to `www` unless the same file exists there too.

**Important:** If the domain redirects `hottakedate.com` → `www.hottakedate.com`, either host the AASA on **both** hosts or pick one canonical domain and use that in entitlements + share links.

## 2. Apple Developer (App ID capability)

1. [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**
2. **Identifiers** → App ID `com.hottakes.app`
3. Enable **Associated Domains** → Save

Team ID in the AASA file is `93X5P98M48` → app id `93X5P98M48.com.hottakes.app`.

## 3. Xcode (iOS app)

In **hot-takes-dating-app**, `HotTakes/HotTakes.entitlements` should contain:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:hottakedate.com</string>
</array>
```

Rebuild and install on a **physical device** (Universal Links are unreliable in Simulator).

**Signing:** Regenerate provisioning profiles after enabling Associated Domains.

## 4. Test

1. Install the app from Xcode on a real iPhone.
2. Send yourself an iMessage or Notes link: `https://hottakedate.com/join?ref=TESTCODE`
3. **Long-press** the link → should offer **Open in Hot Take**.
4. Tap normally → should open the app (may need 24h after first install for Apple’s CDN cache).

Apple’s validator: [App Search Validation Tool](https://search.developer.apple.com/appsearch-validation-tool) (enter `hottakedate.com`).

## Changing paths later

Edit both AASA copies and update `paths` / `components`. Only `/join` is claimed so the rest of the marketing site stays in Safari.
