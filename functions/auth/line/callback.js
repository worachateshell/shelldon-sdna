import { appendToSheet, getSheetValues } from '../../utils/google.js';

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
