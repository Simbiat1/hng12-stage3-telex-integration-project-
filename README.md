# LinkSnap - URL Shortener Integration for Telex

LinkSnap is a simple link shortener that automatically replaces long, unwieldy URLs with concise, shortened links. This integration works with the Telex messaging platform and utilizes the Bitly API for URL shortening.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Usage](#usage)

## Features

- Shortens long URLs to concise links.
- Easy to use with a simple interface.
- Integrates seamlessly with Telex channels.
- Logs incoming requests and responses for debugging.

## Technologies Used

- Node.js
- Express.js
- Axios
- Cheerio
- Bitly API
- Winston (for logging)
- dotenv (for environment variable management)

## Getting Started

To get a local copy up and running, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/hng12-stage3-telex-integration-project.git
   ```

2. **Navigate to the project repository**:

   ```bash
   cd hng12-stage3-telex-integration-project
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Create a .env file in the root directory and add your Bitly access token:**:

   ```bash
   BITLY_ACCESS_TOKEN=your_bitly_access_token
   ```

5. **Start the server**:

   ```bash
   npm run start
   ```

## API Endpoints

**POST `/shortenURL`**

### Description

Accepts a message containing URLs and returns the shortened URL.

### Request Body

```json
{
  "message": "<p><a href='https://example.com'>https://example.com</a></p>",
  "settings": [
    {
      "default": "https://your-lengthy-url.com",
      "description": "Lengthy URL to be shortened.",
      "label": "Long URL",
      "required": true,
      "type": "text"
    }
  ]
}
```

### Response

```json
{
  "message": "https://bit.ly/example",
  "event_name": "link_shortened",
  "status": "success",
  "username": "link-snap-bot"
}
```

**GET `/integration`**

### Description

Serves the integration.json file for the Telex integration.

## Environment Variables

**`BITLY_ACCESS_TOKEN`: Your Bitly API access token.**

## Usage

Once the server is running, you can send a POST request to the `/shortenURL` endpoint with a message containing URLs. The integration will respond with the shortened URL.

### Telex App Usage

- Enable the LinkSnap App on Telex to send outputs to the channel you want to shorten a link in.
- Send the long URL as a message in the channel
- The shortened URL would be sent back as the output
