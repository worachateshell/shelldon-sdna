# Deploy wedding-game to Cloudflare Pages via Wrangler

## Goal Description
Deploy the static wedding-game site (the `public/` folder) to Cloudflare Pages under the project name **sdnawedding** using the Wrangler CLI. The site will be reachable at `https://sdnawedding.pages.dev`.

## Proposed Changes
---
### 1. Project configuration
#### [NEW] wrangler.toml (file:///Users/mbp13-2020-/.gemini/antigravity/scratch/wedding-game/wrangler.toml)
```toml
name = "sdnawedding"
compatibility_date = "2024-09-01"

[site]
bucket = "public"
```
---
### 2. Deployment Script
#### [MODIFY] package.json (file:///Users/mbp13-2020-/.gemini/antigravity/scratch/wedding-game/package.json)
Add a deploy script:
```json
{
  "scripts": {
    "deploy": "wrangler pages publish public --project-name sdnawedding"
  }
}
```
---
## Verification Plan
### Automated
1. Run `npm run deploy` and capture the output URL.
2. `curl -I <url>` to check for 200 OK.
### Manual
1. Open the deployed URL.
2. Verify `randomdraw.html` loads and functions.
