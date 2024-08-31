// eslint-disable-next-line strict
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const sharp = require('sharp');
const { processMrzFromBase64 } = require('./getMrz'); // Adjust the path accordingly

// Path to your image file
const imageFilePath = path.join(__dirname, 'ICCID', 'a.png');

// Extract the base name without extension for the dynamic directory
const imageBaseName = path.basename(imageFilePath, path.extname(imageFilePath));

// Define the path for the cropped image
const croppedImageFileName = 'crop.png';
const sharpImageFileName = 'sharp.png';
const baseOutputDir = path.join(__dirname, 'data', 'imageDir', 'output', imageBaseName); // Dynamic directory
const croppedImageFilePath = path.join(baseOutputDir, croppedImageFileName);
const sharpImageFilePath = path.join(baseOutputDir, sharpImageFileName);

// Promisify exec to use async/await
const execPromise = util.promisify(exec);

// Function to read an image file and convert it to a base64 string
const fileToBase64 = async (filePath) => {
  try {
    const imageBuffer = await fs.readFile(filePath);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`; // Adjust format if needed
  } catch (error) {
    console.error('Error reading the image file:', error);
    throw error;
  }
};

// Function to save a base64 string to a file
const base64ToFile = async (base64String, outputPath) => {
  try {
    const base64Data = base64String.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.ensureDir(path.dirname(outputPath)); // Ensure the output directory exists
    await fs.writeFile(outputPath, buffer);
  } catch (error) {
    console.error('Error saving the base64 image to file:', error);
    throw error;
  }
};

// Function to extract MRZ using Tesseract CLI
const extractMRZ = async (imagePath) => {
  const command = `tesseract ${imagePath} stdout -l mrz --psm 6`;
  try {
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      console.error('Tesseract stderr:', stderr);
    }

    console.log('MRZ Output:');
    console.log(stdout);
    return stdout;
  } catch (error) {
    console.error('Error executing tesseract:', error);
    throw error;
  }
};
// Function to process the image using sharp
const processImage = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .resize({ width: 1200 }) // Resize as needed
      .grayscale() // Convert to grayscale
      .normalize() // Normalize contrast
      .sharpen() // Apply sharpening
      .threshold(0) // Increase threshold value to enhance contrast; adjust as needed
      .toFile(outputPath); // Save to file
    console.log(`Processed image saved to ${outputPath}`);
  } catch (error) {
    console.error('Error processing the image:', error);
    throw error;
  }
};


(async () => {
  try {
    // Convert image file to base64 string
    const base64Input = await fileToBase64(imageFilePath);

    // Process the base64 image to get cropped images
    const croppedBase64Images = await processMrzFromBase64(base64Input);

    // Ensure the cropped image path is available
    if (!croppedBase64Images['crop']) {
      throw new Error('Cropped image "crop" not found in processed images.');
    }

    // Save the specific cropped base64 image to the output directory
    const croppedImageBase64 = croppedBase64Images['crop'];
    await base64ToFile(croppedImageBase64, croppedImageFilePath);
    console.log(`Saved cropped image to ${croppedImageFilePath}`);

    // Process the cropped image with sharp
    await processImage(croppedImageFilePath, sharpImageFilePath);

    // Perform OCR on the processed sharp image using Tesseract CLI
    const ocrText = await extractMRZ(sharpImageFilePath);
    console.log(`OCR Text for processed image:`, ocrText);
  } catch (error) {
    console.error('Failed to process image:', error);
  }
})();
