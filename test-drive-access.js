require('dotenv').config();
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function checkAccess() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: SCOPES,
        });
        const client = await auth.getClient();
        const drive = google.drive({ version: 'v3', auth: client });

        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        console.log("Checking Folder ID:", folderId);

        const response = await drive.files.get({
            fileId: folderId,
            fields: 'id, name, capabilities, permissions, owners',
            supportsAllDrives: true
        });

        console.log("Folder Found!");
        console.log("Name:", response.data.name);
        console.log("Owners:", response.data.owners.map(o => o.emailAddress));
        console.log("Capabilities:", JSON.stringify(response.data.capabilities, null, 2));

    } catch (error) {
        console.error("Access Check Failed:", error.message);
    }
}

checkAccess();
