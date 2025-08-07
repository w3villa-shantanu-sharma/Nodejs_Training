import redisClient from "../utils/redisClient.js";
import podcastIndexClient from "../utils/podcastIndexClient.js";
import * as userRepo from "../utils/userQueryData.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load fallback data
let fallbackPodcasts = [];
try {
  const fallbackPath = join(__dirname, '../data/fallback-podcasts.json');
  fallbackPodcasts = JSON.parse(readFileSync(fallbackPath, 'utf8'));
  console.log(`📦 Loaded ${fallbackPodcasts.length} fallback podcasts`);
} catch (err) {
  console.warn('⚠️ Could not load fallback podcasts:', err.message);
}

export const getMine = async (req, res) => {
  const pages = await userRepo.findByUserUuid(req.user.uuid);
  res.json(pages);
};

export const createPage = async (req, res) => {
  const { username, spotify_link, apple_link, embed_code } = req.body;
  await userRepo.createPage({
    uuid: req.user.uuid,
    username,
    spotify_link,
    apple_link,
    embed_code,
  });
  res.sendStatus(201);
};

export const getPublic = async (req, res) => {
  const page = await userRepo.findByUsernameProfile(req.params.username);
  if (!page) return res.sendStatus(404);
  res.json(page);
};

export const trackClick = async (req, res) => {
  await userRepo.incrementClick(req.params.username);
  res.sendStatus(204);
};

export const trackListenClick = async (req, res) => {
  const { podcastId } = req.params;
  // In a real application, you would save this to a database
  console.log(`▶️ Click tracked for podcast ID: ${podcastId}`);
  res.sendStatus(204); // Send No Content response
};

export const getPublicProfiles = async (req, res) => {
  try {
    const profiles = await userRepo.getPublicPodcastProfiles();
    res.status(200).json(profiles);
  } catch (err) {
    console.error("Error fetching public profiles:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const getPublicPodcastFree = async (req, res) => {
  const query = req.query.q || '';
  const redisKey = `podcast-index:${query || 'trending'}`;

  try {
    // Try getting from cache first (but don't log every cache hit)
    const cached = await redisClient.get(redisKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // If not in cache, make API request
    let podcasts = [];
    const endpoint = query 
      ? `/search/byterm?q=${encodeURIComponent(query)}&max=12`
      : '/podcasts/trending?max=12';
    
    const response = await podcastIndexClient.get(endpoint);
    
    // Process response data
    podcasts = (response.data.feeds || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      thumbnail: p.image,
      listenNotes: p.link,
    }));

    // Only cache if we got real data
    if (podcasts.length > 0) {
      await redisClient.setEx(redisKey, 3600, JSON.stringify(podcasts));
    }
    
    return res.status(200).json(podcasts);
  } catch (err) {
    console.error("❌ Error fetching podcasts:", err.message);
    
    // Use fallback data only when API fails
    if (fallbackPodcasts.length > 0) {
      console.log("⚠️ Using fallback podcast data due to API failure");
      return res.status(200).json(fallbackPodcasts);
    }
    
    // If no fallback available, return empty array with success status
    return res.status(200).json([]);
  }
};

export const getPlaylists = async (req, res) => {
  try {
    const response = await podcastIndexClient.get('/podcasts/trending?max=10');
    const playlists = (response.data.feeds || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      thumbnail: p.image,
      link: p.link, // Changed from listennotes_url
      total: Math.floor(Math.random() * 50) + 10, // Mock episode count
    }));
    return res.status(200).json(playlists);
  } catch (err) {
    console.error("❌ Failed to fetch playlists:", err.message);
    
    // Use fallback for playlists too
    if (fallbackPodcasts.length > 0) {
      const mockPlaylists = fallbackPodcasts.slice(0, 6).map((p, index) => ({
        ...p,
        id: `playlist_${index}`,
        total: Math.floor(Math.random() * 30) + 5,
      }));
      return res.status(200).json(mockPlaylists);
    }
    
    return res.status(500).json({ 
      message: "Playlist fetch error", 
      error: err.message 
    });
  }
};

export const searchPodcasts = async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const response = await podcastIndexClient.get(`/search/byterm?q=${encodeURIComponent(query)}&max=12`);
    const episodes = (response.data.feeds || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      thumbnail: p.image,
      listenNotes: p.link,
    }));
    res.status(200).json(episodes);
  } catch (err) {
    console.error("❌ Search error:", err.message);
    
    // Filter fallback data for search
    if (fallbackPodcasts.length > 0) {
      const filtered = fallbackPodcasts.filter(p => 
        p.title?.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      );
      return res.status(200).json(filtered.slice(0, 12));
    }
    
    res.status(500).json({ 
      message: 'Failed to search podcasts', 
      error: err.message 
    });
  }
};
