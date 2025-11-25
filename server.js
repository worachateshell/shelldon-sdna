require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const axios = require('axios');
const cookieSession = require('cookie-session');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Multer Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'secret'],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Google Sheets Setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let sheets = null;

async function getSheetsClient() {
    if (sheets) return sheets;

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: SCOPES,
        });
        const client = await auth.getClient();
        sheets = google.sheets({ version: 'v4', auth: client });
        return sheets;
    } catch (e) {
        console.error("Google Auth Error:", e.message);
        return null;
    }
}

// Google Drive integration removed - using R2 only

// Cloudflare R2 Client Setup
let r2Client = null;
function getR2Client() {
    if (r2Client) return r2Client;

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        console.log("R2 credentials not configured, skipping R2 upload");
        return null;
    }

    r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });
    return r2Client;
}

async function uploadToR2(filePath, mimeType, originalName) {
    const client = getR2Client();
    if (!client) return null;

    try {
        const fileContent = fs.readFileSync(filePath);
        const fileName = `slips/${Date.now()}-${originalName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: mimeType,
        });

        await client.send(command);

        // Return public URL (if bucket has public access configured)
        const publicUrl = process.env.R2_PUBLIC_URL
            ? `${process.env.R2_PUBLIC_URL}/${fileName}`
            : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`;

        return publicUrl;
    } catch (err) {
        console.error("R2 Upload Error:", err.message);
        return null;
    }
}

// Google Drive upload function removed - using R2 only

// Routes

// 1. Get Guests (from Sheets)
app.get('/api/guests', async (req, res) => {
    const client = await getSheetsClient();
    if (!client || !process.env.GOOGLE_SHEET_ID) {
        // Fallback to local file if Sheets not configured
        return res.json(getLocalGuests());
    }

    try {
        const response = await client.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Users!A:C', // Columns: Name, PictureURL, LineID
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.json([]);
        }

        // Transform rows to objects
        // Assuming Row 1 is header, start from Row 2? Or just raw data.
        // Let's assume raw data for simplicity or check if first row is header.
        // Format: { name: "Name", pictureUrl: "URL" }
        const guests = rows.map(row => ({
            name: row[0],
            pictureUrl: row[1] || null
        })).filter(g => g.name && g.name !== 'Name'); // Filter out header if exists

        res.json(guests);
    } catch (err) {
        console.error("Sheets API Error:", err.message);
        res.json(getLocalGuests());
    }
});

// Helper for local guests
function getLocalGuests() {
    const DATA_FILE = path.join(__dirname, 'guests.json');
    if (fs.existsSync(DATA_FILE)) {
        try {
            const raw = JSON.parse(fs.readFileSync(DATA_FILE));
            // Convert string array to objects if needed
            return raw.map(g => typeof g === 'string' ? { name: g, pictureUrl: null } : g);
        } catch (e) { return []; }
    }
    return [];
}

// 2. LINE Login Auth
app.get('/auth/line', (req, res) => {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.LINE_CHANNEL_ID,
        redirect_uri: process.env.LINE_CALLBACK_URL,
        state: 'random_state_string', // Should be randomized
        scope: 'profile openid',
        bot_prompt: 'aggressive', // Prompt to add LINE OA as friend
    });
    res.redirect(`https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`);
});

app.get('/auth/line/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        // Exchange code for token
        const tokenRes = await axios.post('https://api.line.me/oauth2/v2.1/token', new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.LINE_CALLBACK_URL,
            client_id: process.env.LINE_CHANNEL_ID,
            client_secret: process.env.LINE_CHANNEL_SECRET,
        }));

        const { access_token, id_token } = tokenRes.data;

        // Get Profile
        const profileRes = await axios.get('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { userId, displayName, pictureUrl } = profileRes.data;

        // Save to Google Sheets (returns true if newly added, false if already exists)
        const isNewUser = await saveGuestToSheet(displayName, pictureUrl, userId);

        // Redirect with appropriate status
        if (isNewUser) {
            res.redirect('/register.html?status=success');
        } else {
            res.redirect('/register.html?status=already_registered');
        }

    } catch (err) {
        console.error("LINE Login Error:", err.response ? err.response.data : err.message);
        res.redirect('/register.html?status=error');
    }
});

async function saveGuestToSheet(name, pictureUrl, lineId) {
    const client = await getSheetsClient();
    if (!client || !process.env.GOOGLE_SHEET_ID) {
        console.log("Saving locally:", name);
        // Fallback local save
        const guests = getLocalGuests();
        const exists = guests.some(g => g.lineId === lineId);
        if (!exists) {
            const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
            guests.push({ name, pictureUrl, lineId, timestamp });
            fs.writeFileSync(path.join(__dirname, 'guests.json'), JSON.stringify(guests));
            return true; // New user
        }
        return false; // Already exists
    }

    try {
        // Ensure 'Users' sheet exists
        const meta = await client.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID });
        const sheetExists = meta.data.sheets.some(s => s.properties.title === 'Users');

        if (!sheetExists) {
            await client.spreadsheets.batchUpdate({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                resource: {
                    requests: [{ addSheet: { properties: { title: 'Users' } } }]
                }
            });
            // Add Header
            await client.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID,
                range: 'Users!A:D',
                valueInputOption: 'USER_ENTERED',
                resource: { values: [['Name', 'Picture URL', 'LINE ID', 'Timestamp']] }
            });
        }

        // Check if user exists
        const rows = await client.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Users!C:C', // Check LINE ID column
        });

        const existingIds = rows.data.values ? rows.data.values.flat() : [];
        if (existingIds.includes(lineId)) {
            console.log(`User ${name} (${lineId}) already exists. Skipping.`);
            return false;
        }

        // Add new user with timestamp
        const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
        await client.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Users!A:D',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [[name, pictureUrl, lineId, timestamp]] }
        });
        return true; // New user added
    } catch (err) {
        console.error("Failed to append to sheet:", err.message);
        return false; // Indicate failure
    }
}

// 3. QR Code
app.get('/api/qr', async (req, res) => {
    // Point to the LINE Login route or the register page which has the login button
    // Better to point to register page so they can see "Login with LINE"
    // Use machine IP if possible, but localhost for now
    const url = `http://localhost:${PORT}/payment.html`;

    try {
        const qrImage = await QRCode.toDataURL(url);
        res.json({ qrImage, url });
    } catch (err) {
        res.status(500).json({ error: "Failed to generate QR code" });
    }
});

// 4. Digital Envelope (Wishes & Slips)
app.post('/api/envelope', upload.single('slip'), async (req, res) => {
    try {
        const { name, amount, wish, bank } = req.body;
        const slipPath = req.file ? `/uploads/${req.file.filename}` : null;

        // Upload to R2 only
        let uploadedLink = null;
        if (req.file) {
            uploadedLink = await uploadToR2(req.file.path, req.file.mimetype, req.file.originalname);
            if (!uploadedLink) {
                console.log('R2 upload failed, file saved locally at:', slipPath);
            }
        }

        const wishData = {
            name,
            amount,
            bank,
            wish,
            slipPath: uploadedLink || slipPath, // Use uploaded link if available, else local path
            timestamp: new Date().toISOString()
        };

        // Save locally
        saveWishLocally(wishData);

        // Save to Sheets (if available)
        await saveWishToSheet(wishData);

        res.json({ success: true, message: "Wish received!" });
    } catch (err) {
        console.error("Envelope Error:", err.message);
        res.status(500).json({ error: "Failed to process request" });
    }
});

// Helper: Save Wish Locally
function saveWishLocally(data) {
    const DATA_FILE = path.join(__dirname, 'wishes.json');
    let wishes = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            wishes = JSON.parse(fs.readFileSync(DATA_FILE));
        } catch (e) { }
    }
    wishes.push(data);
    fs.writeFileSync(DATA_FILE, JSON.stringify(wishes, null, 2));
}

// Helper: Save Wish to Sheet
async function saveWishToSheet(data) {
    const client = await getSheetsClient();
    if (!client || !process.env.GOOGLE_SHEET_ID) return;

    try {
        // Assuming Sheet2 is for Wishes, or append to Sheet1 with different columns?
        // Let's use 'Wishes!A:E' (Name, Amount, Wish, SlipURL, Timestamp)
        // Note: User needs to create "Wishes" sheet or we just append to a new range.
        // For safety, let's try to append to a sheet named "Wishes".

        await client.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            range: 'Wishes!A:F',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[data.name, data.amount, data.bank, data.wish, data.slipPath, data.timestamp]]
            }
        });
    } catch (err) {
        console.error("Failed to save wish to sheet:", err.message);
    }
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
