import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { RekognitionService } from '../../services/rekognition.service';

export const registerFace = async (req: Request, res: Response) => {
  try {
    const { s3Key } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!s3Key) {
      return res.status(400).json({ success: false, error: 's3Key is required' });
    }

    // Call AWS Rekognition to index the face
    const faceId = await RekognitionService.indexUserFace(userId, s3Key);

    if (!faceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'No face detected in the image or failed to process. Please ensure the photo clearly shows your face.' 
      });
    }

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        face_rekognition_id: faceId,
        face_s3_key: s3Key,
        face_indexed: true,
      }
    });

    res.json({
      success: true,
      message: 'Face registered successfully',
    });
  } catch (error) {
    console.error('Register Face Error:', error);
    res.status(500).json({ success: false, error: 'Failed to register face' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { full_name, bio } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        full_name: full_name !== undefined ? full_name : undefined,
        bio: bio !== undefined ? bio : undefined,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        username: true,
        avatar_s3_key: true,
        bio: true,
        is_admin: true,
        face_indexed: true,
        created_at: true
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        full_name: true,
        username: true,
        bio: true,
        avatar_s3_key: true,
        created_at: true,
        memberships: {
          include: {
            club: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { full_name: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        avatar_s3_key: true
      },
      take: 10
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Count user's total photos (uploaded)
    const totalPhotos = await prisma.media.count({
      where: { uploaded_by: userId, upload_status: 'completed' }
    });

    // Count user's active clubs
    const myClubsCount = await prisma.clubMembership.count({
      where: { user_id: userId, status: 'active' }
    });

    // Count upcoming events for user's clubs
    const memberships = await prisma.clubMembership.findMany({
      where: { user_id: userId, status: 'active' },
      select: { club_id: true }
    });
    const clubIds = memberships.map(m => m.club_id);

    const upcomingEvents = await prisma.event.count({
      where: {
        club_id: { in: clubIds },
        event_date: { gte: new Date() }
      }
    });

    res.json({
      success: true,
      data: {
        totalPhotos,
        myClubsCount,
        upcomingEvents
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
};
