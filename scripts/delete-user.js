require('dotenv').config();
const { google } = require('googleapis');

const USER_ID_TO_DELETE = 'Ua3d4362ea8964b8ccd08608feee4a886';

async function deleteUser() {
    try {
        // Setup Google Sheets API
        const auth = new google.auth.GoogleAuth({
            keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!spreadsheetId) {
            throw new Error('GOOGLE_SHEET_ID not found in .env');
        }

        console.log(`Looking for user with LINE ID: ${USER_ID_TO_DELETE}\n`);

        // Get spreadsheet metadata to find the correct sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const usersSheet = spreadsheet.data.sheets.find(sheet => sheet.properties.title === 'Users');
        if (!usersSheet) {
            throw new Error('Users sheet not found');
        }

        const sheetId = usersSheet.properties.sheetId;
        console.log(`Users sheet ID: ${sheetId}`);

        // Get all users from the sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Users!A:D',
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) {
            console.log('No users found in the sheet.');
            return;
        }

        // Find the row with the user ID (column C)
        let rowIndex = -1;
        let userName = '';

        for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
            if (rows[i][2] === USER_ID_TO_DELETE) { // Column C (index 2) is LINE ID
                rowIndex = i + 1; // +1 because sheets are 1-indexed
                userName = rows[i][0]; // Column A is name
                break;
            }
        }

        if (rowIndex === -1) {
            console.log(`❌ User with LINE ID ${USER_ID_TO_DELETE} not found in the sheet.`);
            console.log('The user may not be registered yet.');
            return;
        }

        console.log(`Found user: ${userName}`);
        console.log(`Row number: ${rowIndex}`);
        console.log(`\nDeleting user from sheet...`);

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex - 1, // 0-indexed for API
                                endIndex: rowIndex
                            }
                        }
                    }
                ]
            }
        });

        console.log(`✅ Successfully deleted user "${userName}" from the Users sheet!`);
        console.log(`\nThe user can now register again as a new user.`);
        console.log(`LINE ID: ${USER_ID_TO_DELETE}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Details:', error.response.data);
        }
        process.exit(1);
    }
}

deleteUser();
