import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import path from "path"; 
import { fileURLToPath } from "url";
import winston from "winston";
import cors from "cors";
import * as cheerio from "cheerio";

const { combine, timestamp, json, prettyPrint, errors } = winston.format;

dotenv.config();

const app = express();

app.use(cors());

const PORT = process.env.PORT || 4000;
const logger = winston.createLogger({
    level: "info",
    format: combine(
        errors({ stack: true }),
        timestamp(),
        json(),
        prettyPrint()
    ),
    transports: [
        new winston.transports.File({ filename: "combined.log" }),
        new winston.transports.Console(),
    ],
});

// Middleware to parse JSON requests
app.use(express.json());

// Function to extract URLs from HTML content
function extractUrlsFromHtml(html) {
    const $ = cheerio.load(html);
    const urls = [];
    $('a').each((index, element) => {
        const url = $(element).attr('href');
        if (url) {
            urls.push(url);
        }
    });
    return urls;
}

// Function to shorten a link using Bitly API
async function shortenLink(longLink) {
    try {
        const response = await axios.post('https://api-ssl.bitly.com/v4/shorten', {
            "long_url": longLink
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.BITLY_ACCESS_TOKEN}`
            }
        });

        return response.data; // Return the full response from Bitly
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Endpoint to handle incoming messages for the modifier integration
app.post('/shortenURL', async (req, res) => {
    // Logs incoming request
    logger.info("Incoming request", { body: req.body });

    const { message, settings } = req.body; 

    if (!message || !settings) {
        return res.status(400).json({ error: 'Message and settings are required' });
    }

    // Extract URLs from HTML message
    const urls = extractUrlsFromHtml(message);

    if (!urls.length) {
        // If no URLs are found, return the original message
        return res.json({ message });
    }

    try {
        // Shortening logic
        const shortenPromises = urls.map(url => shortenLink(url)); // Create an array of promises to shorten each URL
        const shortenedUrls = await Promise.all(shortenPromises); // Wait for all promises to resolve

        const firstShortenedUrl = shortenedUrls[0].link; // Gets the shortened link from the first URL

        // Logs formatted message
        logger.info("Formatted message", { message: firstShortenedUrl });

        // Responds with only the shortened URL
        res.json({ 
          message: firstShortenedUrl, // SendS only the shortened URL
            event_name: "link_shortened",
            // message: modifiedMessage,
            status: "success",
            username: "link-snap-bot" 
        });
    } catch (error) {
        logger.error('Error processing request', {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: 'Failed to process the message' });
    }
});

// Route to serve the integration.json file
app.get('/integration', (req, res) => {
    const __filename = fileURLToPath(import.meta.url); // Gets the current file's path
    const __dirname = path.dirname(__filename); // Gets the directory name
    res.sendFile(path.join(__dirname, 'integration.json')); // Sends the integration.json file
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});