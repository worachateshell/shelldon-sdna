require('dotenv').config();
const { S3Client, PutObjectCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function testR2() {
    console.log('Testing R2 Connection...\n');

    console.log('Configuration:');
    console.log('- Account ID:', process.env.R2_ACCOUNT_ID);
    console.log('- Bucket Name:', process.env.R2_BUCKET_NAME);
    console.log('- Access Key ID:', process.env.R2_ACCESS_KEY_ID?.substring(0, 8) + '...');
    console.log('- Secret Key:', process.env.R2_SECRET_ACCESS_KEY ? 'Set ✓' : 'Not set ✗');
    console.log('');

    const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });

    // Test 1: List buckets
    try {
        console.log('Test 1: Listing buckets...');
        const listCommand = new ListBucketsCommand({});
        const response = await client.send(listCommand);
        console.log('✓ Success! Found buckets:', response.Buckets?.map(b => b.Name).join(', '));
    } catch (err) {
        console.log('✗ Failed:', err.message);
    }

    // Test 2: Upload test file
    try {
        console.log('\nTest 2: Uploading test file...');
        const testContent = 'Test upload from wedding app';
        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: 'test-upload.txt',
            Body: testContent,
            ContentType: 'text/plain',
        });

        await client.send(command);
        console.log('✓ Success! File uploaded to:', process.env.R2_BUCKET_NAME);
        console.log('URL:', `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/test-upload.txt`);
    } catch (err) {
        console.log('✗ Failed:', err.message);
        console.log('Error code:', err.Code || err.$metadata?.httpStatusCode);
    }
}

testR2();
