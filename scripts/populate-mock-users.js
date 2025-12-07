require('dotenv').config();
const { google } = require('googleapis');

// Thai first names and last names for realistic mock data
const thaiFirstNames = [
    'สมชาย', 'สมหญิง', 'วิชัย', 'วิภา', 'ประเสริฐ', 'ประนอม', 'สุรชัย', 'สุดา',
    'นิรันดร์', 'นิภา', 'วีระ', 'วารี', 'ชัยวัฒน์', 'ชนิดา', 'อนุชา', 'อรุณี',
    'พิชัย', 'พิมพ์', 'ธนา', 'ธนิดา', 'กิตติ', 'กนิษฐา', 'ปิยะ', 'ปิยะนุช',
    'ศักดิ์', 'ศิริ', 'จักร', 'จันทร์', 'รัตน์', 'รุ่ง', 'สุข', 'สาย',
    'เดช', 'เดือน', 'บุญ', 'บัว', 'ทอง', 'ทิพย์', 'แสง', 'แก้ว',
    'นพ', 'นภา', 'มานะ', 'มาลี', 'ยศ', 'ยุพา', 'ลักษณ์', 'ลิขิต',
    'วัน', 'วันดี', 'สิน', 'สินี', 'หนึ่ง', 'หนึ่งฤทัย', 'อำนาจ', 'อัญชลี',
    'เอก', 'เอื้อ', 'โชค', 'โฉม', 'ใจ', 'ใหม่', 'ไพร', 'ไพบูลย์'
];

const thaiLastNames = [
    'ใจดี', 'สุขสันต์', 'รักษา', 'พัฒนา', 'เจริญ', 'มั่นคง', 'สว่าง', 'สมบูรณ์',
    'ทรงพล', 'ทรงศักดิ์', 'วงศ์', 'ศรี', 'ทอง', 'เงิน', 'แก้ว', 'คำ',
    'บุญ', 'ชัย', 'ดี', 'สุข', 'รุ่ง', 'เรือง', 'สง่า', 'งาม',
    'มั่น', 'แข็ง', 'แกร่ง', 'กล้า', 'หาญ', 'เด่น', 'ดัง', 'โชค',
    'ลาภ', 'ยศ', 'ศักดิ์', 'สิทธิ์', 'วิทย์', 'ชาติ', 'ประเสริฐ', 'วิเศษ',
    'พิเศษ', 'สุด', 'เลิศ', 'ยอด', 'เยี่ยม', 'ดีเลิศ', 'สมบัติ', 'ทรัพย์',
    'มณี', 'รัตน์', 'พร', 'ชนะ', 'ชนม์', 'ชีวิต', 'ภูมิ', 'ภักดี'
];

// Generate random Thai name
function generateThaiName() {
    const firstName = thaiFirstNames[Math.floor(Math.random() * thaiFirstNames.length)];
    const lastName = thaiLastNames[Math.floor(Math.random() * thaiLastNames.length)];
    return `${firstName} ${lastName}`;
}

// Generate mock profile URL (using placeholder avatar service)
function generateProfileUrl(index) {
    // Using UI Avatars service with Thai names
    const colors = ['D4AF37', 'F4C430', '4CAF50', '2196F3', 'FF9800', 'E91E63', '9C27B0', '00BCD4'];
    const color = colors[index % colors.length];
    return `https://ui-avatars.com/api/?name=User+${index}&background=${color}&color=fff&size=200`;
}

// Generate LINE ID
function generateLineId(index) {
    return `U${String(index).padStart(32, '0')}`;
}

async function populateMockUsers() {
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

        console.log('Generating 600 mock users...');

        // Generate 600 users
        const users = [];
        const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

        for (let i = 1; i <= 600; i++) {
            users.push([
                generateThaiName(),
                generateProfileUrl(i),
                generateLineId(i),
                timestamp
            ]);
        }

        console.log('Clearing existing data in Users sheet...');

        // Clear existing data (except header)
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: 'Users!A2:D',
        });

        console.log('Writing mock data to Google Sheets...');

        // Write all users at once (batch operation)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Users!A2:D',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: users
            }
        });

        console.log(`✅ Successfully added ${users.length} mock users to Google Sheets!`);
        console.log('Sample users:');
        console.log('  1.', users[0][0]);
        console.log('  2.', users[1][0]);
        console.log('  3.', users[2][0]);
        console.log('  ...');
        console.log(`  ${users.length}.`, users[users.length - 1][0]);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
populateMockUsers();
