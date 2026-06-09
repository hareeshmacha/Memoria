import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        actor: { select: { id: true, full_name: true, avatar_s3_key: true } }
      }
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const notificationId = req.params.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.user_id !== userId) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
};
