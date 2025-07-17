const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authenciate');
const controller = require('../controllers/podcastController');

router.get('/mine', auth, controller.getMine);
router.post('/create', auth, controller.createPage);
router.get('/free', controller.getPublicPodcastFree);
router.get('/playlists', controller.getPlaylists);
router.get('/search', controller.searchPodcasts); // Search route

router.get('/public', controller.getPublicProfiles);
router.get('/:username', controller.getPublic);
router.post('/track/:username', controller.trackClick);

module.exports = router;
