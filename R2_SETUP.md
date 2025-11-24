# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 for storing payment slip uploads.

## What is Cloudflare R2?

Cloudflare R2 is an S3-compatible object storage service with:
- ✅ **No egress fees** (free data transfer out)
- ✅ **S3-compatible API** (works with existing tools)
- ✅ **10 GB free storage** per month
- ✅ **Global CDN** for fast access

## Step 1: Create an R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2** in the sidebar
3. Click **Create bucket**
4. Enter a bucket name (e.g., `wedding-slips`)
5. Click **Create bucket**

## Step 2: Configure Public Access (Optional)

If you want uploaded files to be publicly accessible:

1. Go to your bucket settings
2. Click **Settings** tab
3. Under **Public access**, click **Allow Access**
4. Optionally, connect a custom domain for cleaner URLs

## Step 3: Create API Tokens

1. In the R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Give it a name (e.g., `wedding-app`)
4. Set permissions:
   - **Object Read & Write**
5. Click **Create API Token**
6. **Save the credentials** shown:
   - Access Key ID
   - Secret Access Key
   - Account ID

## Step 4: Update Your .env File

Add the following to your `.env` file:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=wedding-slips

# Optional: If you configured a custom domain
R2_PUBLIC_URL=https://files.yourdomain.com
```

**Replace the placeholder values** with your actual credentials from Step 3.

## Step 5: Test the Upload

1. Start your server:
   ```bash
   npm start
   ```

2. Go to the payment page and upload a test slip

3. Check your R2 bucket to verify the file was uploaded

## File Organization

Uploaded files are stored with the following structure:
```
slips/
  ├── 1234567890-slip1.jpg
  ├── 1234567891-slip2.png
  └── ...
```

The timestamp prefix ensures unique filenames.

## Viewing Uploaded Files

### Option 1: Cloudflare Dashboard
- Go to your R2 bucket
- Browse the `slips/` folder

### Option 2: Public URL (if configured)
- Files will be accessible at: `https://your-domain.com/slips/filename.jpg`

### Option 3: R2 Direct URL
- Files are accessible at: `https://[bucket].[account-id].r2.cloudflarestorage.com/slips/filename.jpg`

## Fallback Behavior

The application is configured with **automatic fallback**:
1. **First**, it tries to upload to R2
2. **If R2 fails**, it falls back to Google Drive
3. **If both fail**, it stores locally in `/uploads`

This ensures uploads always succeed, even if R2 is not configured.

## Cost Estimate

For a wedding with 100 guests uploading 5MB slips:
- **Storage**: 500 MB (well within 10 GB free tier)
- **Requests**: 100 writes (Class A operations)
- **Egress**: FREE (no egress fees)

**Estimated cost**: $0.00 (within free tier)

## Troubleshooting

**Upload fails with "Access Denied":**
- Verify your API token has **Object Read & Write** permissions
- Check that credentials in `.env` are correct

**Files not accessible:**
- Ensure public access is enabled on your bucket
- Verify the `R2_PUBLIC_URL` is correct

**R2 not being used:**
- Check server logs for "R2 credentials not configured"
- Ensure all R2 environment variables are set

## Security Notes

- ✅ API tokens are stored in `.env` (not committed to Git)
- ✅ Files are organized in a dedicated `slips/` folder
- ✅ Automatic fallback ensures reliability
- ⚠️ If using public access, anyone with the URL can view files

## Next Steps

After setup:
1. Test uploading a slip
2. Verify it appears in your R2 bucket
3. Check that the URL is saved to Google Sheets
4. (Optional) Configure a custom domain for cleaner URLs
