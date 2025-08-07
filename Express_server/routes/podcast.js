import express from 'express';
import authenticate from '../middlewares/authenciate.js';
import * as controller from '../controllers/podcastController.js';

const router = express.Router();

router.get('/mine', authenticate, controller.getMine);
router.post('/create', authenticate, controller.createPage);
router.get('/free', controller.getPublicPodcastFree);
router.get('/playlists', controller.getPlaylists);
router.get('/search', controller.searchPodcasts); // Search route
router.post('/track-listen/:podcastId', controller.trackListenClick);
router.get('/public', controller.getPublicProfiles);
router.get('/:username', controller.getPublic);
router.post('/track/:username', controller.trackClick);

export default router;
