require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const RICH_MENU_IMAGE_PATH = path.join(__dirname, '../public/rich-menu.png');

if (!CHANNEL_ACCESS_TOKEN) {
    console.error('Error: LINE_CHANNEL_ACCESS_TOKEN is missing in .env');
    process.exit(1);
}

const richMenuObject = {
    size: {
        width: 2500,
        height: 1686
    },
    selected: true,
    name: 'Wedding Main Menu',
    chatBarText: 'Menu',
    areas: [
        // Top Left: Register
        {
            bounds: { x: 0, y: 0, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://liff.line.me/' + process.env.LIFF_ID_REGISTER } // Ideally use LIFF, but for now maybe direct link or just web link
        },
        // Top Center: Schedule
        {
            bounds: { x: 833, y: 0, width: 834, height: 843 },
            action: { type: 'uri', uri: 'https://liff.line.me/' + process.env.LIFF_ID_SCHEDULE }
        },
        // Top Right: Location
        {
            bounds: { x: 1667, y: 0, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://maps.app.goo.gl/your-location-link' } // Placeholder
        },
        // Bottom Left: Gallery
        {
            bounds: { x: 0, y: 843, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://liff.line.me/' + process.env.LIFF_ID_GALLERY }
        },
        // Bottom Center: Game
        {
            bounds: { x: 833, y: 843, width: 834, height: 843 },
            action: { type: 'uri', uri: 'https://liff.line.me/' + process.env.LIFF_ID_GAME }
        },
        // Bottom Right: Wishes
        {
            bounds: { x: 1667, y: 843, width: 833, height: 843 },
            action: { type: 'uri', uri: 'https://liff.line.me/' + process.env.LIFF_ID_WISHES }
        }
    ]
};

// Since we might not have LIFF IDs yet, let's use web URLs for now or placeholders
// We will modify the action to be simple URIs to the website pages
const websiteUrl = 'https://sdnawedding.pages.dev'; // Or localhost for testing, but Rich Menu needs public URLs usually or just opens browser
// Actually, for Rich Menu to open internal browser, we usually use LIFF. 
// If we use normal https links, it opens in external browser (or internal depending on settings).
// Let's use the website URL + path.

richMenuObject.areas = [
    // 1. Register
    {
        bounds: { x: 0, y: 0, width: 833, height: 843 },
        action: { type: 'uri', uri: `${websiteUrl}/register.html` }
    },
    // 2. Schedule
    {
        bounds: { x: 833, y: 0, width: 834, height: 843 },
        action: { type: 'uri', uri: `${websiteUrl}/#schedule` }
    },
    // 3. Location
    {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: { type: 'uri', uri: 'https://maps.app.goo.gl/your-location-link' } // Update this!
    },
    // 4. Gallery
    {
        bounds: { x: 0, y: 843, width: 833, height: 843 },
        action: { type: 'uri', uri: `${websiteUrl}/#gallery` }
    },
    // 5. Game
    {
        bounds: { x: 833, y: 843, width: 834, height: 843 },
        action: { type: 'uri', uri: `${websiteUrl}/game.html` }
    },
    // 6. Wishes
    {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: { type: 'uri', uri: `${websiteUrl}/payment.html` }
    }
];

async function createRichMenu() {
    try {
        // 1. Create Rich Menu
        console.log('Creating Rich Menu...');
        const createRes = await axios.post('https://api.line.me/v2/bot/richmenu', richMenuObject, {
            headers: {
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const richMenuId = createRes.data.richMenuId;
        console.log('Rich Menu ID:', richMenuId);

        // 2. Upload Image
        console.log('Uploading Image...');
        const imageBuffer = fs.readFileSync(RICH_MENU_IMAGE_PATH);
        await axios.post(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, imageBuffer, {
            headers: {
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
                'Content-Type': 'image/png'
            }
        });
        console.log('Image uploaded.');

        // 3. Set as Default
        console.log('Setting as Default...');
        await axios.post(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {}, {
            headers: {
                'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
            }
        });
        console.log('Rich Menu set as default successfully!');

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

createRichMenu();
