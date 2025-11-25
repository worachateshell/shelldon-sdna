import { appendToSheet } from '../../utils/google.js';

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
