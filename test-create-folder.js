require('dotenv').config();
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function createFolderTest() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: SCOPES,
        });
        const client = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: client });

        console.log("Attempting to create a test folder...");

        const fileMetadata = {
            name: 'Wedding App Test Folder',
            mimeType: 'application/vnd.google-apps.folder',
        };

        const response = await drive.files.create({
            resource: fileMetadata,
            fields: 'id, webViewLink',
        });

        console.log("Folder Created Successfully!");
        console.log("Folder ID:", response.data.id);
        console.log("Link:", response.data.webViewLink);

    } catch (error) {
        console.error("Creation Failed:", error.message);
    }
}

createFolderTest();
