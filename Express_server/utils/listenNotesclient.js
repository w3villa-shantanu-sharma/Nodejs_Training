const { Client } = require('podcast-api');

const client = Client({ apiKey: process.env.LISTEN_NOTES_API_KEY });

module.exports = client;
