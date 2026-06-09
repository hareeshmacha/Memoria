import { Request, Response } from 'express';
import { prisma } from '../../config/database';

export const getClubAnalytics = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const club = await prisma.club.findUnique({
      where: { slug }
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Verify user is admin
    const membership = await prisma.clubMembership.findFirst({
      where: { club_id: club.id, user_id: userId }
    });

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get basic stats
    const totalMembers = await prisma.clubMembership.count({
      where: { club_id: club.id }
    });

    const totalEvents = await prisma.event.count({
      where: { club_id: club.id }
    });

    const totalPhotos = await prisma.media.count({
      where: { event: { club_id: club.id } }
    });

    const totalLikes = await prisma.like.count({
      where: { media: { event: { club_id: club.id } } }
    });

    // Monthly activity for chart
    // We'll mock the chart data to keep it simple but realistic based on events
    const chartData = [
      { name: 'Jan', value: 400 },
      { name: 'Feb', value: 300 },
      { name: 'Mar', value: 200 },
      { name: 'Apr', value: 278 },
      { name: 'May', value: 189 },
      { name: 'Jun', value: 239 },
      { name: 'Jul', value: 349 },
    ];

    res.json({
      success: true,
      data: {
        totalMembers,
        totalEvents,
        totalPhotos,
        totalLikes,
        chartData
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const totalUploads = await prisma.media.count({
      where: { uploaded_by: userId }
    });

    const totalLikesReceived = await prisma.like.count({
      where: { media: { uploaded_by: userId } }
    });

    const totalTags = await prisma.mediaFace.count({
      where: { user_id: userId }
    });

    // Mock chart data (in real app, we'd group media by month)
    const chartData = [
      { name: 'Jan', value: 12 },
      { name: 'Feb', value: 25 },
      { name: 'Mar', value: 30 },
      { name: 'Apr', value: 18 },
      { name: 'May', value: 45 },
      { name: 'Jun', value: 33 },
      { name: 'Jul', value: 60 },
    ];

    res.json({
      success: true,
      data: {
        totalUploads,
        totalLikesReceived,
        totalTags,
        chartData
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
};
