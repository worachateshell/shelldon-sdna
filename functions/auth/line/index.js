export async function onRequest(context) {
    const { env } = context;
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.LINE_CHANNEL_ID,
        redirect_uri: env.LINE_CALLBACK_URL,
        state: 'random_state_string', // Should be randomized
        scope: 'profile openid',
        bot_prompt: 'aggressive',
    });
    return Response.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`, 302);
}
