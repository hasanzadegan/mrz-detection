const Jimp = require('jimp');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');


// Function to rotate an image
const rotateImage = async (base64Image, degrees) => {
    const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const image = sharp(imageBuffer);

    const rotatedBuffer = await image
        .rotate(degrees) // Rotate the image
        .toBuffer();

    const rotatedBase64 = `data:image/png;base64,${rotatedBuffer.toString('base64')}`;
    return rotatedBase64;
};

const cropBottomHalf = async (base64Image) => {
    // Decode the base64 image into a buffer
    const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    // Read the image with Jimp
    const image = await Jimp.read(imageBuffer);

    // Get the image dimensions
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Check if the image is vertical (height > width)
    if (height > width) {
        // Crop the bottom half if the image is vertical
        const halfHeight = Math.floor(height / 2);
        image.crop(0, halfHeight, width, halfHeight);
    }

    // Convert the cropped image back to a base64 string
    const croppedBase64 = await image.getBase64Async(Jimp.MIME_PNG);
    return croppedBase64;
};

const base64ToFile = async (base64String, outputPath) => {
    const base64Data = base64String.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.ensureDir(path.dirname(outputPath)); // Ensure the output directory exists
    await fs.writeFile(outputPath, buffer);

    // Use sharp to determine image orientation
    const image = sharp(buffer);
    const metadata = await image.metadata();
    console.log(outputPath,metadata.orientation)
    return metadata.orientation; // This will give you the orientation of the image
};

// Function to apply image processing (threshold) using sharp
const applyThreshold = async (inputPath, outputPath, thresholdValue = 0) => {
    await sharp(inputPath)
        .resize({ width: 1200 }) // Resize as needed
        .grayscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen()   // Apply sharpening
        .threshold(thresholdValue) // Apply threshold
        .toFile(outputPath); // Save to file
};


module.exports = { rotateImage, cropBottomHalf, base64ToFile,applyThreshold};
