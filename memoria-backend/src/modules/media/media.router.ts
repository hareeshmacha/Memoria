import { Router } from 'express';
import { getPresignedUrl, saveMediaRecord, getMyPhotos, searchMedia, getFeed, getEventMedia, deleteMedia, getFavourites, toggleFavourite, toggleLike, trackDownload, downloadWatermarked } from './media.controller';
import { getComments, addComment, deleteComment } from '../comments/comments.controller';
import { addTag, removeTag } from '../tags/tags.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Feeds and Lists
router.get('/feed', authenticate, getFeed);
router.get('/favourites', authenticate, getFavourites);
router.get('/event/:id', authenticate, getEventMedia);

// Interaction Routes
router.post('/:id/like', authenticate, toggleLike);
router.post('/:id/favourite', authenticate, toggleFavourite);
router.post('/:id/download', authenticate, trackDownload);
router.get('/:id/download/watermark', authenticate, downloadWatermarked);

// Comments
router.get('/:id/comments', authenticate, getComments);
router.post('/:id/comments', authenticate, addComment);
router.delete('/comments/:commentId', authenticate, deleteComment);

// Tags
router.post('/:id/tags', authenticate, addTag);
router.delete('/tags/:tagId', authenticate, removeTag);

// AI Views
router.get('/my-photos', authenticate, getMyPhotos);
router.get('/search', searchMedia);

// Get an S3 presigned URL for direct upload
router.post('/upload-url', authenticate, getPresignedUrl);

// Save the media record to the database after successful upload
router.post('/', authenticate, saveMediaRecord);

// Delete Media
router.delete('/:id', authenticate, deleteMedia);

export const mediaRouter = router;
