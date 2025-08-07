import * as userRepo from '../utils/userQueryData.js';
import { extractVideoId, isValidYouTubeUrl, getVideoDetails, getPlanLimits } from '../utils/youtubeApi.js';

export const getUserYouTubeLinks = async (req, res) => {
  try {
    const links = await userRepo.getUserYouTubeLinks(req.user.uuid);
    res.json(links);
  } catch (error) {
    console.error('Error fetching YouTube links:', error);
    res.status(500).json({ message: 'Failed to fetch YouTube links' });
  }
};

export const addYouTubeLink = async (req, res) => {
  try {
    const { youtube_url } = req.body;
    const userUuid = req.user.uuid;

    // Validate URL
    if (!isValidYouTubeUrl(youtube_url)) {
      return res.status(400).json({ message: 'Invalid YouTube URL' });
    }

    // Extract video ID
    const videoId = extractVideoId(youtube_url);
    if (!videoId) {
      return res.status(400).json({ message: 'Could not extract video ID from URL' });
    }

    // Get user's current plan - Use the new function
    const userPlan = await userRepo.getUserPlan(userUuid);

    // Check plan limits
    const planLimit = getPlanLimits(userPlan);
    if (planLimit === 0) {
      return res.status(403).json({ 
        message: 'YouTube links not available on FREE plan. Please upgrade your plan.',
        requiresUpgrade: true 
      });
    }

    // Check current usage
    const currentCount = await userRepo.getUserYouTubeLinkCount(userUuid);
    if (currentCount >= planLimit) {
      return res.status(403).json({ 
        message: `You've reached your limit of ${planLimit} YouTube links for the ${userPlan} plan.`,
        currentCount,
        planLimit,
        requiresUpgrade: true 
      });
    }

    // Fetch video details from YouTube API
    let videoDetails;
    try {
      videoDetails = await getVideoDetails(videoId);
    } catch (error) {
      // Fallback if YouTube API fails
      videoDetails = {
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        channelTitle: 'Unknown Channel',
        description: '',
      };
    }

    // Save to database
    const linkData = {
      youtube_url,
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnail,
      video_id: videoId,
    };

    await userRepo.createYouTubeLink(userUuid, linkData);

    res.status(201).json({ 
      message: 'YouTube link added successfully',
      ...linkData,
      currentCount: currentCount + 1,
      planLimit 
    });

  } catch (error) {
    console.error('Error adding YouTube link:', error);
    res.status(500).json({ message: 'Failed to add YouTube link' });
  }
};

export const deleteYouTubeLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const userUuid = req.user.uuid;

    await userRepo.deleteYouTubeLink(linkId, userUuid);
    res.json({ message: 'YouTube link deleted successfully' });
  } catch (error) {
    console.error('Error deleting YouTube link:', error);
    res.status(500).json({ message: 'Failed to delete YouTube link' });
  }
};