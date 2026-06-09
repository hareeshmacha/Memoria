import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { getIO } from '../../socket';

export const addTag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const mediaId = req.params.id;
    const { taggedUserId } = req.body;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!taggedUserId) return res.status(400).json({ success: false, error: 'User to tag is required' });

    // Check if tag already exists
    const existing = await prisma.tagInMedia.findUnique({
      where: {
        media_id_tagged_user_id: {
          media_id: mediaId,
          tagged_user_id: taggedUserId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'User is already tagged in this media' });
    }

    const tag = await prisma.tagInMedia.create({
      data: {
        media_id: mediaId,
        tagged_user_id: taggedUserId,
        tagged_by: userId
      },
      include: {
        tagged_user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } }
      }
    });

    const tagger = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
    if (tagger && taggedUserId !== userId) {
      const notification = await prisma.notification.create({
        data: {
          user_id: taggedUserId,
          type: 'tag',
          actor_id: userId,
          entity_type: 'media',
          entity_id: mediaId,
          message: `${tagger.full_name} tagged you in a photo.`
        }
      });
      getIO().to(`user:${taggedUserId}`).emit('notification', notification);
    }

    res.json({ success: true, data: tag });
  } catch (error) {
    console.error('Add tag error:', error);
    res.status(500).json({ success: false, error: 'Failed to add tag' });
  }
};

export const removeTag = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const tagId = req.params.tagId;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const tag = await prisma.tagInMedia.findUnique({ where: { id: tagId }, include: { media: true } });
    if (!tag) return res.status(404).json({ success: false, error: 'Tag not found' });

    // Only allow deletion if user is the tagger, the tagged user, or the uploader of the media
    if (tag.tagged_by !== userId && tag.tagged_user_id !== userId && tag.media.uploaded_by !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to remove this tag' });
    }

    await prisma.tagInMedia.delete({ where: { id: tagId } });

    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove tag' });
  }
};
