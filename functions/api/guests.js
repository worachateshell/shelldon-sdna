import { getSheetValues } from '../utils/google.js';

export async function onRequest(context) {
    const { env } = context;

    try {
        const response = await getSheetValues(env, 'Users!A:C');
        const rows = response.values;

        if (!rows || rows.length === 0) {
            return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Transform rows to objects
        // Format: { name: "Name", pictureUrl: "URL" }
        const guests = rows.map(row => ({
            name: row[0],
            pictureUrl: row[1] || null
        })).filter(g => g.name && g.name !== 'Name'); // Filter out header if exists

        return new Response(JSON.stringify(guests), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
