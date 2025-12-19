const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function checkDrive() {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // 1. Check About (Storage Quota)
        const about = await drive.about.get({
            fields: 'user, storageQuota'
        });
        console.log('Service Account User:', about.data.user.emailAddress);
        // console.log('Storage Quota:', about.data.storageQuota);

        // 2. Check Folder Access
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        console.log('\nChecking access to folder:', folderId);

        try {
            const folder = await drive.files.get({
                fileId: folderId,
                fields: 'name, capabilities, owners'
            });
            console.log('Folder Name:', folder.data.name);
            console.log('Can Add Children:', folder.data.capabilities.canAddChildren);
            console.log('Owners:', folder.data.owners.map(o => o.emailAddress));
        } catch (e) {
            console.error('❌ Cannot access folder. Make sure it is shared with the Service Account email.');
            console.error(e.message);
        }

    } catch (e) {
        console.error('Auth Error:', e.message);
    }
}

checkDrive();
