const crypto = require('crypto');
const axios = require('axios');

// Get API credentials
const apiKey = process.env.PODCAST_INDEX_KEY;
let apiSecret = process.env.PODCAST_INDEX_SECRET;

// Remove surrounding quotes if present
if (apiSecret && apiSecret.startsWith('"') && apiSecret.endsWith('"')) {
  apiSecret = apiSecret.slice(1, -1);
}

if (!apiKey || !apiSecret) {
  console.error('❌ Podcast Index API key or secret is missing in environment variables!');
}

console.log("PodcastIndex API Key:", apiKey);
console.log("PodcastIndex API Secret (first 8 chars):", apiSecret ? apiSecret.substring(0, 8) : "MISSING");

const client = axios.create({
  baseURL: 'https://api.podcastindex.org/api/1.0',
});

// Add request interceptor to generate fresh auth headers for each request
client.interceptors.request.use(config => {
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create the auth hash according to documentation
  // https://podcastindex-org.github.io/docs-api/#overview--authentication-details
  const data = apiKey + apiSecret + timestamp;
  const hash = crypto.createHash('sha1').update(data).digest('hex');
  
  // Set required headers
  config.headers['X-Auth-Date'] = timestamp;
  config.headers['X-Auth-Key'] = apiKey;
  config.headers['Authorization'] = hash;
  config.headers['User-Agent'] = 'PodcastHub/1.0';
  
  return config;
});

// Response interceptor for additional error logging
client.interceptors.response.use(
  response => {
    console.log("✅ Podcast Index API request successful");
    return response;
  },
  error => {
    console.error("❌ Podcast Index API error:", 
      error.response?.data?.description || error.message);
    return Promise.reject(error);
  }
);

module.exports = client;