import { getAccessToken } from '../utils/google.js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const { lineId } = await request.json();
        if (!lineId) {
            return new Response("Missing lineId", { status: 400 });
        }

        const token = await getAccessToken(env);
        const spreadsheetId = env.GOOGLE_SHEET_ID;

        // 1. Find the row number by checking Column C (Line ID)
        const range = 'Users!C:C';
        const urlGet = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
        const resGet = await fetch(urlGet, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataGet = await resGet.json();
        const rows = dataGet.values || [];

        // Find index (flat array of column C)
        // Row 1 is header. Data starts from Row 2.
        // API returns [[ID1], [ID2], ...] so we need to flatten or access [0]
        const rowIndex = rows.findIndex(row => row[0] === lineId);

        if (rowIndex === -1) {
            return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Sheet row number = rowIndex + 1 (because array is 0-based and sheet rows are 1-based)
        const sheetRow = rowIndex + 1;

        // 2. Update Column E (Prize) for that row
        const updateRange = `Users!E${sheetRow}`;
        const urlUpdate = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`;

        const resUpdate = await fetch(urlUpdate, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [["ได้รับรางวัล"]]
            })
        });

        if (!resUpdate.ok) {
            throw new Error(`Failed to update sheet: ${resUpdate.statusText}`);
        }

        return new Response(JSON.stringify({ success: true, row: sheetRow }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
