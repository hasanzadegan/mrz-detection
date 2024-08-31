const util = require('util');
const { exec } = require('child_process');
const crypto = require('crypto');

const generateRandomFileName = () => crypto.randomBytes(16).toString('hex');

const execPromise = util.promisify(exec);
const extractMRZ = async (imagePath) => {
    const command = `tesseract ${imagePath} stdout -l mrz --psm 6`;
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
        console.error('Tesseract stderr:', stderr);
    }
    return stdout.trim();
};
const replaceDigits = (text) => text.replace(/\d/g, (digit) => 'OIZEASGTBP'[digit]);
const parseMrz = (mrzText) => {
    const lines = mrzText.split('\n').map(line => line.trim()).filter(line => line.length > 0);


    if (lines.length < 2) {
        return {error: 'Invalid MRZ format. At least 2 lines are required.'};
    }

    const line1 = lines[lines.length - 2];
    const line2 = lines[lines.length - 1];

    const namePart = line1.substring(5);
    const nameFields = namePart.split('<<');

    const familyName = replaceDigits(nameFields[0].replace(/<+/g, ' ').trim());
    const givenNames = nameFields[1] ? replaceDigits(nameFields[1].replace(/<+/g, ' ').trim()) : '';

    const passportNumber = line2.substring(0, 9).trim();
    const nationality = replaceDigits(line2.substring(10, 13).trim());
    const birthDate = line2.substring(13, 19);
    const expiryDate = line2.substring(21, 27);

    const formatDate = (dateStr) => `${dateStr.substring(0, 2)}/${dateStr.substring(2, 4)}/${dateStr.substring(4, 6)}`;

    return {
        line1,
        line2,
        familyName,
        givenNames,
        passportNo: passportNumber,
        nationality,
        birthDate: formatDate(birthDate),
        expiryDate: formatDate(expiryDate),
    };
};
const isValidPassportNumber = (passportNo) => /^[A-Z]/.test(passportNo);

module.exports = { generateRandomFileName,extractMRZ,parseMrz,isValidPassportNumber};
