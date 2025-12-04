const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, '../public/rich-menu.png');
const outputPath = path.join(__dirname, '../public/rich-menu-resized.png');

async function resizeImage() {
    try {
        await sharp(inputPath)
            .resize(2500, 1686, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            })
            .toFormat('jpeg')
            .toFile(outputPath);

        console.log('Image resized successfully to:', outputPath);

        // Replace original
        fs.renameSync(outputPath, inputPath);
        console.log('Original file replaced.');

    } catch (err) {
        console.error('Error resizing image:', err);
    }
}

resizeImage();
