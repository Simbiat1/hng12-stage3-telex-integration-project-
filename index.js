import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import path from "path"; 
import { fileURLToPath } from "url";
import winston from "winston";
import cors from "cors";
import * as cheerio  from "cheerio";

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

        return response.data;
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

    if (!message || !settings ) {
        return res.status(400).json({ error: 'Message, channel_id, and settings are required' });
    }

    //Extract urls from html message
    const urls = extractUrlsFromHtml(message);

    // // Regular expression to find URLs in the message
    // const urlRegex = /(https?:\/\/[^\s]+)/g;
    // const urls = message.match(urlRegex); // Finds all URLs in the message

    if (!urls.length) {
        // If no URLs are found, returns the original message
        return res.json({ message });
    }

    let modifiedMessage = message; // Starting with the original message
    
    try {
        // Shortening logic
        const shortenPromises = urls.map(url => shortenLink(url)); // Creates an array of promises to shorten each URL
        const shortenedUrls = await Promise.all(shortenPromises); // Waits for all promises to resolve

        shortenedUrls.forEach((shortenedUrl, index) => {
            modifiedMessage = modifiedMessage.replace(urls[index], shortenedUrl.link);
        }); // Replaces original URLs with shortened URLs in the message

        // Logs formatted message
        logger.info("Formatted message", { message: modifiedMessage });

        
        // Responds with the modified message
        res.json({ 
            event_name: "link_shortened",
            message: modifiedMessage,
            status: "success",
            username: "link-snap-bot" 
        });
        logger.info("response", {response: res.json})
    } catch (error) {
        logger.error('Error processing request', {
            message: error.message,
            stack: error.stack,
            requestBody: { content: modifiedMessage }
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