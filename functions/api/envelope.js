import { SignJWT, importPKCS8 } from 'jose';

async function getAccessToken(env) {
    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON");
    }
    const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const algorithm = 'RS256';
    const pkcs8 = await importPKCS8(serviceAccount.private_key, algorithm);

    const jwt = await new SignJWT({
        scope: 'https://www.googleapis.com/auth/spreadsheets',
    })
        .setProtectedHeader({ alg: algorithm })
        .setIssuer(serviceAccount.client_email)
        .setAudience('https://oauth2.googleapis.com/token')
        .setExpirationTime('1h')
        .setIssuedAt()
        .sign(pkcs8);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    const data = await response.json();
    return data.access_token;
}

async function appendToSheet(env, range, values) {
    const token = await getAccessToken(env);
    const spreadsheetId = env.GOOGLE_SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
    });
    return response.json();
}

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const formData = await request.formData();
        const name = formData.get('name');
        const amount = formData.get('amount');
        const wish = formData.get('wish');
        const bank = formData.get('bank');
        const file = formData.get('slip');

        let slipUrl = null;

        if (file && file instanceof File) {
            const filename = `slips/${Date.now()}-${file.name}`;
            // Upload to R2 using binding
            await env.WEDDING_SLIPS.put(filename, file.stream(), {
                httpMetadata: { contentType: file.type }
            });

            // Construct public URL
            // Assuming R2_PUBLIC_URL is set to the custom domain or r2.dev URL
            if (env.R2_PUBLIC_URL) {
                slipUrl = `${env.R2_PUBLIC_URL}/${filename}`;
            } else {
                // Fallback if no public URL configured (might not be accessible)
                slipUrl = filename;
            }
        }

        const timestamp = new Date().toISOString();

        // Save to Sheets: Name, Amount, Bank, Wish, SlipURL, Timestamp
        await appendToSheet(env, 'Wishes!A:F', [[name, amount, bank, wish, slipUrl, timestamp]]);

        return new Response(JSON.stringify({ success: true, message: "Wish received!" }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
