import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { getIO } from '../../socket';

export const getComments = async (req: Request, res: Response) => {
  try {
    const mediaId = req.params.id;
    const comments = await prisma.comment.findMany({
      where: { media_id: mediaId, parent_id: null },
      include: {
        user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } },
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const mediaId = req.params.id;
    const { content } = req.body;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!content) return res.status(400).json({ success: false, error: 'Content is required' });

    const comment = await prisma.comment.create({
      data: {
        user_id: userId,
        media_id: mediaId,
        content
      },
      include: {
        user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } }
      }
    });

    await prisma.media.update({
      where: { id: mediaId },
      data: { comment_count: { increment: 1 } }
    });

    // Notify the uploader
    const media = await prisma.media.findUnique({ where: { id: mediaId }, select: { uploaded_by: true, event: { select: { title: true } } } });
    if (media && media.uploaded_by && media.uploaded_by !== userId) {
      const notification = await prisma.notification.create({
        data: {
          user_id: media.uploaded_by,
          type: 'comment',
          actor_id: userId,
          entity_type: 'media',
          entity_id: mediaId,
          message: `${comment.user.full_name} commented on your photo.`
        }
      });
      getIO().to(`user:${media.uploaded_by}`).emit('notification', notification);
    }

    res.json({ success: true, data: comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const commentId = req.params.commentId;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ success: false, error: 'Comment not found' });
    if (comment.user_id !== userId) return res.status(403).json({ success: false, error: 'Forbidden' });

    await prisma.comment.delete({ where: { id: commentId } });

    await prisma.media.update({
      where: { id: comment.media_id },
      data: { comment_count: { decrement: 1 } }
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
};
