import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Extract video ID from YouTube URL
export const extractVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Validate if URL is a YouTube URL
export const isValidYouTubeUrl = (url) => {
  const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return regex.test(url);
};

// Fetch video details from YouTube API
export const getVideoDetails = async (videoId) => {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'AIzaSyDV6KlyWzK-Vh-xq1kJe-AUfu-eqsze_wo') {
    throw new Error('YouTube API key not configured');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'snippet',
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });

    const video = response.data.items[0];
    if (!video) {
      throw new Error('Video not found');
    }

    return {
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description,
    };
  } catch (error) {
    console.error('Error fetching YouTube video details:', error);
    throw new Error('Failed to fetch video details');
  }
};

// Get plan limits
export const getPlanLimits = (plan) => {
  const limits = {
    FREE: 0,
    SILVER: 5,
    GOLD: 50,
    PREMIUM: 100,
  };
  return limits[plan] || 0;
};