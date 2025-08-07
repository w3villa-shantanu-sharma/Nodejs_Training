import crypto from 'crypto';
import axios from 'axios';
import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.PODCAST_INDEX_KEY;
const apiSecret = process.env.PODCAST_INDEX_SECRET;

// Only log once on startup
if (!apiKey || !apiSecret) {
  console.error('Missing Podcast Index API credentials in .env file');
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const client = axios.create({
  baseURL: 'https://api.podcastindex.org/api/1.0',
  httpsAgent,
  timeout: 10000
});

// Simplified request interceptor
client.interceptors.request.use(config => {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const authString = apiKey + apiSecret + timestamp;
    const hash = crypto.createHash('sha1').update(authString).digest('hex');
    
    config.headers = {
      ...config.headers,
      'User-Agent': 'PodcastHub/1.0',
      'X-Auth-Date': timestamp,
      'X-Auth-Key': apiKey,
      'Authorization': hash
    };
    
    return config;
  } catch (error) {
    console.error('Error setting up request headers:', error.message);
    return Promise.reject(error);
  }
});

// Simplified response interceptor - only log errors
client.interceptors.response.use(
  response => response, // Don't log successful responses
  error => {
    if (error.response?.status === 403) {
      console.error("Podcast Index API: Access forbidden (check credentials or network)");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("Podcast Index API: Connection refused (network/firewall issue)");
    } else {
      console.error("Podcast Index API error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default client;