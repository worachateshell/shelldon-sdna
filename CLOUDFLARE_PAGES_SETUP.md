# Cloudflare Pages Deployment Guide

Your project has been migrated to support **Cloudflare Pages & Functions**. Follow these steps to deploy.

## 1. Prerequisites
- A Cloudflare account.
- `npm` installed (you already have this).

## 2. Login to Cloudflare
Run the following command in your terminal to login:
```bash
npx wrangler login
```

## 3. Create R2 Bucket (if not exists)
If you haven't created the bucket `wedding-slips` yet:
```bash
npx wrangler r2 bucket create wedding-slips
```

## 4. Deploy to Pages
Run the following command to deploy your `public` folder and `functions`:
```bash
npx wrangler pages deploy public
```
*   Select "Create a new project" if asked.
*   Enter project name: `wedding-game`
*   Production branch: `main` (or just press enter)

## 5. Configure Environment Variables
Go to the [Cloudflare Dashboard](https://dash.cloudflare.com) > **Pages** > **wedding-game** > **Settings** > **Environment Variables**.
Add the following variables (Production & Preview):

| Variable | Value |
| :--- | :--- |
| `LINE_CHANNEL_ID` | Your LINE Channel ID |
| `LINE_CHANNEL_SECRET` | Your LINE Channel Secret |
| `LINE_CALLBACK_URL` | `https://wedding-game.pages.dev/auth/line/callback` (Update this after deploy!) |
| `GOOGLE_SHEET_ID` | Your Google Sheet ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The **entire content** of your `credentials.json` file (minified) |
| `R2_PUBLIC_URL` | (Optional) Public URL for your R2 bucket if you have a custom domain |

## 6. Bind R2 Bucket
In **Settings** > **Functions** > **R2 Bucket Bindings**:
*   **Variable name:** `WEDDING_SLIPS`
*   **R2 Bucket:** `wedding-slips`

## 7. Update LINE Login
Go to [LINE Developers Console](https://developers.line.biz/).
Update the **Callback URL** to match your new Pages URL:
`https://wedding-game.pages.dev/auth/line/callback`
(Or your custom domain if you set one up)

## 8. Redeploy
After setting variables and bindings, you must redeploy for them to take effect:
```bash
npx wrangler pages deploy public
```
