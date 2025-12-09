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

async function getSheetValues(env, range) {
    const token = await getAccessToken(env);
    const spreadsheetId = env.GOOGLE_SHEET_ID;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    return response.json();
}

export async function onRequest(context) {
    const { env } = context;

    try {
        // Fetch only column A to minimize data
        const response = await getSheetValues(env, 'Users!A:A');
        const rows = response.values;

        // Count rows, subtracting 1 for header if present
        // If rows is null/undefined, count is 0
        const count = rows ? Math.max(0, rows.length - 1) : 0;

        return new Response(JSON.stringify({ count }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
