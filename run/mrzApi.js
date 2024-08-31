// eslint-disable-next-line strict
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { processImageAndExtractMrz } = require('./mrzProcessing');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// POST endpoint for processing images
app.post('/process-image', async (req, res) => {
  try {
    const { base64Image } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: 'Base64 image data is required.' });
    }

    // Process the image and extract MRZ data
    const result = await processImageAndExtractMrz(base64Image);
    // result.ICCID = await processImageAndExtractMrz(base64Image);


    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    // Respond with` the result
    res.json(result);
  } catch (error) {
    console.error('Failed to process image:', error);
    res.status(500).json({ error: 'Failed to process image.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
