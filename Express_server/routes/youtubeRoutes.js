import express from 'express';
import * as youtubeController from '../controllers/youtubeController.js';
import authenticate from '../middlewares/authenciate.js';

const router = express.Router();

router.get('/links', authenticate, youtubeController.getUserYouTubeLinks);
router.post('/links', authenticate, youtubeController.addYouTubeLink);
router.delete('/links/:linkId', authenticate, youtubeController.deleteYouTubeLink);

export default router;