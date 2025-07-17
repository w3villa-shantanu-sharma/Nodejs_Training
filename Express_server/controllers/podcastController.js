const redisClient = require("../utils/redisClient");
const listenNotesClient = require("../utils/listenNotesclient");
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




exports.getPublicPodcastFree = async (req, res) => {
  const query = req.query.q; // optional search
  const region = req.query.region || 'us';
  const redisKey = query
    ? `podcast_search:${query}:${region}`
    : `random_podcasts:${region}`;

  try {
    // Serve cached result if available
    const cached = await redisClient.get(redisKey);
    if (cached) {
      console.log("✅ Cached served:", redisKey);
      return res.status(200).json(JSON.parse(cached));
    }

    let podcasts = [];

    if (query) {
      // If search query is given
      const searchRes = await listenNotesClient.search({
        q: query,
        type: 'podcast',
        page_size: 10,
      });

      podcasts = (searchRes.results || []).map((p) => ({
        id: p.id,
        title: p.title_original,
        description: p.description_original,
        thumbnail: p.thumbnail,
        listenNotes: p.listennotes_url,
        audio_length_sec: p.audio_length_sec || 1800,
      }));
    } else {
      // If no search query, show random trending ones
      const best = await listenNotesClient.fetchBestPodcasts({
        genre_id: 1305, // Comedy is popular
        page: Math.floor(Math.random() * 3) + 1, // Random page 1-3
        region,
        sort: 'listen_score',
        safe_mode: 1,
      });

      podcasts = (best.podcasts || []).map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        thumbnail: p.image,
        listenNotes: p.listennotes_url,
        audio_length_sec: (p.total_episodes || 20) * 60,
      }));
    }

    await redisClient.setEx(redisKey, 600, JSON.stringify(podcasts));
    console.log("🔄 Fetched & cached:", redisKey);

    return res.status(200).json(podcasts);
  } catch (err) {
    console.error("❌ Podcast fetch error:", err.message);
    return res.status(500).json({ message: 'Error fetching podcasts', error: err.message });
  }
};

// Show real ListenNotes playlists on Home page
exports.getPlaylists = async (req, res) => {
  try {
    const response = await listenNotesClient.fetchMyPlaylists({
      sort: 'recent_added_first',
      page: 1,
    });

    const playlists = (response.playlists || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      thumbnail: p.thumbnail,
      listennotes_url: p.listennotes_url,
    }));

    return res.status(200).json(playlists);
  } catch (err) {
    console.error("❌ Failed to fetch playlists:", err.message);
    return res.status(500).json({ message: "Playlist fetch error", error: err.message });
  }
};


exports.searchPodcasts = async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: 'Search query is required' });

  try {
    const response = await listenNotesClient.search({
      q: query,
      type: 'episode',
      sort_by_date: 0,
      page_size: 12,
      language: 'English',
      safe_mode: 1,
    });

    const episodes = (response.results || []).map((ep) => ({
      id: ep.id,
      title: ep.title_original,
      description: ep.description_original,
      thumbnail: ep.thumbnail,
      audio_length_sec: ep.audio_length_sec,
      listenNotes: ep.listennotes_url,
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
