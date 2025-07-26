const redisClient = require("../utils/redisClient");
const podcastIndexClient = require("../utils/podcastIndexClient");
const userRepo = require("../utils/userQueryData");

exports.getMine = async (req, res) => {
  const pages = await userRepo.findByUserUuid(req.user.uuid);
  res.json(pages);
};

exports.createPage = async (req, res) => {
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

exports.getPublic = async (req, res) => {
  const page = await userRepo.findByUsername(req.params.username);
  if (!page) return res.sendStatus(404);
  res.json(page);
};

exports.trackClick = async (req, res) => {
  await userRepo.incrementClick(req.params.username);
  res.sendStatus(204);
};

exports.getPublicProfiles = async (req, res) => {
  try {
    const profiles = await userRepo.getPublicPodcastProfiles();
    res.status(200).json(profiles);
  } catch (err) {
    console.error("Error fetching public profiles:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// --- REWRITTEN FUNCTION ---
exports.getPublicPodcastFree = async (req, res) => {
  const query = req.query.q || '';
  const redisKey = `podcast-index:${query || 'trending'}`;

  try {
    const cached = await redisClient.get(redisKey);
    if (cached) {
      console.log("✅ Cached served:", redisKey);
      return res.status(200).json(JSON.parse(cached));
    }

    let podcasts = [];
    let response;

    if (query) {
      // --- Use Podcast Index Search ---
      response = await podcastIndexClient.get(`/search/byterm?q=${encodeURIComponent(query)}&max=12`);
      podcasts = (response.data.feeds || []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        thumbnail: p.image,
        listenNotes: p.link, // Use the general link
      }));
    } else {
      // --- Use Podcast Index Trending ---
      response = await podcastIndexClient.get('/podcasts/trending?max=12');
      podcasts = (response.data.feeds || []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        thumbnail: p.image,
        listenNotes: p.link,
      }));
    }

    await redisClient.setEx(redisKey, 3600, JSON.stringify(podcasts)); // Cache for 1 hour
    console.log("🔄 Fetched & cached from Podcast Index:", redisKey);
    return res.status(200).json(podcasts);

  } catch (err) {
    console.error("❌ Podcast Index API error:", 
      err.response?.data?.description || err.message);
    
    // Return cached data as fallback if available
    try {
      const cachedFallback = await redisClient.get('podcast-index:fallback');
      if (cachedFallback) {
        console.log("⚠️ Using fallback cache due to API error");
        return res.status(200).json(JSON.parse(cachedFallback));
      }
    } catch (cacheErr) {
      console.error("Cache fallback also failed:", cacheErr);
    }
    
    // Return empty array as last resort
    return res.status(200).json([]);
  }
};


// --- REWRITTEN FUNCTION ---
exports.getPlaylists = async (req, res) => {
  // The concept of "My Playlists" is specific to ListenNotes.
  // We will simulate this by fetching trending podcasts as a default.
  try {
    const response = await podcastIndexClient.get('/podcasts/trending?max=10');
    const playlists = (response.data.feeds || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      thumbnail: p.image,
      listennotes_url: p.link,
    }));
    return res.status(200).json(playlists);
  } catch (err) {
    console.error("❌ Failed to fetch trending for playlists:", err.message);
    return res.status(500).json({ message: "Playlist fetch error", error: err.message });
  }
};


// --- REWRITTEN FUNCTION ---
exports.searchPodcasts = async (req, res) => {
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
    res.status(500).json({ message: 'Failed to search podcasts', error: err.message });
  }
};


// controllers/podcastSearchController.js

// exports.searchStarWarsEpisodes = async (req, res) => {
//   try {
//     const response = await lnClient.search({
//       q:               'star wars',
//       type:            'episode',
//       len_min:         10,
//       len_max:         30,
//       genre_ids:       '68,82',
//       language:        'English',
//       safe_mode:       0,
//       page_size:       10,
//       sort_by_date:    0,
//       only_in:         'title,description',
//       offset:          0,
//       published_before: 1580172454000 // example filter
//     });

//     // Map to a slim format your frontend wants
//     const results = response.data.results.map(ep => ({
//       id:          ep.id,
//       title:       ep.title_original,
//       podcast:     ep.podcast_title_original,
//       thumbnail:   ep.thumbnail,
//       audio:       ep.audio,
//       listenNotes: ep.listennotes_url,
//       description: ep.description_original,
//       audio_length_sec: ep.audio_length_sec
//     }));

//     res.status(200).json(results);
//   } catch (err) {
//     console.error('Podcast search error:', err.message);
//     res.status(500).json({ message: 'Search failed' });
//   }
// };
