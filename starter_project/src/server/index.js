// Import required dependencies
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

// Initialize the Express application
const app = express();

// Apply middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON request bodies

// Encapsulated function to scrape text from a URL
async function scrapeTextFromURL(url) {
    try {
        console.log(`Fetching and scraping text from URL: ${url}`);

        // Fetch the webpage data
        const { data } = await axios.get(url);

        // Use Cheerio to load the HTML and extract the text
        const $ = cheerio.load(data);
        const text = $('body').text().trim();

        if (!text) {
            console.error('No text content found at the provided URL');
            return null;
        }

        // Extract and return the first 200 characters of the text
        return text.slice(0, 200);
    } catch (error) {
        console.error('Error while scraping text from the URL:', error.message);
        throw new Error('Failed to scrape text from the URL');
    }
}

// Route to analyze text from a URL
app.post('/analyze-url', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Scrape text from the provided URL
        const text = await scrapeTextFromURL(url);
        if (!text) {
            return res.status(400).json({ error: 'No text content found at the provided URL' });
        }

        // Call the Udacity NLP API
        const nlpResponse = await axios.post('https://api.meaningcloud.com/sentiment-2.1', {
            key: 'YOUR_API_KEY',
            lang: 'en',
            txt: text,
        });

        // Extract necessary data from the API response
        const { score_tag, agreement, subjectivity, confidence, irony } = nlpResponse.data;

        // Send the results back to the client
        return res.json({
            sentiment: score_tag,
            agreement,
            subjectivity,
            confidence,
            irony,
            textPreview: text,
        });
    } catch (error) {
        console.error('Error during API request:', error.message);
        return res.status(500).json({ error: 'Failed to analyze the URL' });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send("This is the server API page. You may access its services via the client app.");
});

// Start the server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
