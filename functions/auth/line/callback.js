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
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
        return new Response('No code provided', { status: 400 });
    }

    try {
        // Exchange code for token
        const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: env.LINE_CALLBACK_URL,
                client_id: env.LINE_CHANNEL_ID,
                client_secret: env.LINE_CHANNEL_SECRET,
            }),
        });

        const tokenData = await tokenRes.json();
        const { access_token } = tokenData;

        if (!access_token) {
            throw new Error('Failed to get access token');
        }

        // Get Profile
        const profileRes = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const profileData = await profileRes.json();
        const { userId, displayName, pictureUrl } = profileData;

        // Check if user exists
        const existingData = await getSheetValues(env, 'Users!C:C');
        const existingIds = existingData.values ? existingData.values.flat() : [];

        let isNewUser = false;
        if (!existingIds.includes(userId)) {
            // Add new user with timestamp
            const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
            await appendToSheet(env, 'Users!A:D', [[displayName, pictureUrl, userId, timestamp]]);
            isNewUser = true;
        }

        // Redirect
        const status = isNewUser ? 'success' : 'already_registered';
        return Response.redirect(`${url.origin}/register.html?status=${status}`, 302);

    } catch (err) {
        return Response.redirect(`${url.origin}/register.html?status=error`, 302);
    }
}
