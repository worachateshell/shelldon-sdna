import { SignJWT, importPKCS8 } from 'jose';

export async function getAccessToken(env) {
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

export async function appendToSheet(env, range, values) {
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

export async function getSheetValues(env, range) {
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
