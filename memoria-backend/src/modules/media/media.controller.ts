import { Request, Response } from 'express';
import { S3Service } from '../../services/s3.service';
import { getIO } from '../../socket';
import { prisma } from '../../config/database';
import { z } from 'zod';
import { mediaQueue } from '../../config/bullmq';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const getUploadUrlSchema = z.object({
  contentType: z.string().min(1),
  folder: z.string().optional(),
});

const saveMediaSchema = z.object({
  clubId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  albumId: z.string().uuid().optional(),
  originalName: z.string(),
  s3Key: z.string(),
  sizeBytes: z.number().int().positive(),
  contentType: z.string(),
  visibility: z.string().optional()
});

export const getPresignedUrl = async (req: Request, res: Response) => {
  try {
    console.log('Generating presigned URL for:', req.body);
    const { contentType, folder } = getUploadUrlSchema.parse(req.body);
    const { uploadUrl, key } = await S3Service.generatePresignedUploadUrl(contentType, folder || 'uploads');
    
    console.log('Successfully generated URL with key:', key);
    res.json({
      success: true,
      data: {
        uploadUrl,
        key,
      }
    });
  } catch (error) {
    console.error('S3 Upload URL Error:', error);
    res.status(400).json({ success: false, error: 'Failed to generate upload URL' });
  }
};

export const saveMediaRecord = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const data = saveMediaSchema.parse(req.body);

    // Verify user is in club and can upload
    const membership = await prisma.clubMembership.findUnique({
      where: {
        user_id_club_id: { user_id: userId, club_id: data.clubId }
      }
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'photographer')) {
      return res.status(403).json({ success: false, error: 'Not authorized to upload to this club' });
    }

    // NEW SECURITY CHECK: Verify event actually belongs to the club
    if (data.eventId) {
      const event = await prisma.event.findUnique({ where: { id: data.eventId } });
      if (!event || event.club_id !== data.clubId) {
        return res.status(400).json({ success: false, error: 'Event does not belong to this club' });
      }
    }

    const media = await prisma.media.create({
      data: {
        s3_key: data.s3Key,
        original_filename: data.originalName,
        file_type: data.contentType.startsWith('image/') ? 'image' : 'video',
        mime_type: data.contentType,
        file_size_bytes: data.sizeBytes,
        uploaded_by: userId,
        club_id: data.clubId,
        event_id: data.eventId,
        album_id: data.albumId,
        width_px: data.width,
        height_px: data.height,
        upload_status: 'processing',
        visibility: data.visibility || 'public' // Default to public if not provided
      }
    });

    // Enqueue background processing job
    await mediaQueue.add('process_media', { 
      mediaId: media.id, 
      s3Key: media.s3_key 
    });

    res.status(201).json({ 
      success: true, 
      data: {
        ...media,
        file_size_bytes: media.file_size_bytes.toString()
      } 
    });
  } catch (error) {
    console.error('Save media error:', error);
    res.status(500).json({ success: false, error: 'Failed to save media record' });
  }
};

export const getFeed = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let allowedClubIds: string[] = [];

    if (userId) {
      const memberships = await prisma.clubMembership.findMany({
        where: { user_id: userId, status: 'active' },
        select: { club_id: true }
      });
      allowedClubIds = memberships.map(m => m.club_id);
    }

    // If not authenticated, return empty feed
    if (!userId) {
       return res.json({ success: true, data: [], pagination: { total: 0, page, limit, hasMore: false } });
    }

    const whereClause = {
      upload_status: 'completed',
      uploaded_by: userId
    };

    const totalCount = await prisma.media.count({ where: whereClause as any });

    const media = await prisma.media.findMany({
      where: whereClause as any,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        uploader: { select: { id: true, full_name: true, avatar_s3_key: true } },
        club: { select: { id: true, name: true, slug: true } },
        event: { select: { id: true, title: true, slug: true } },
        likes: userId ? { where: { user_id: userId } } : false,
        tags_in_media: { include: { tagged_user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } } } }
      }
    });

    const serialized = await Promise.all(media.map(async m => ({
      ...m,
      isLiked: m.likes ? m.likes.length > 0 : false,
      file_size_bytes: m.file_size_bytes.toString(),
      signed_url: await S3Service.generatePresignedDownloadUrl(m.s3_key)
    })));

    res.json({ 
      success: true, 
      data: serialized,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: skip + media.length < totalCount
      }
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, error: 'Failed to get feed' });
  }
};

export const getEventMedia = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = (req as any).user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    let isMember = false;
    if (userId) {
      const membership = await prisma.clubMembership.findUnique({
        where: { user_id_club_id: { user_id: userId, club_id: event.club_id } }
      });
      if (membership && membership.status === 'active') isMember = true;
    }

    const whereClause = {
      event_id: eventId,
      upload_status: 'completed',
      ...(isMember ? {} : { visibility: 'public' })
    };

    const totalCount = await prisma.media.count({ where: whereClause as any });

    const media = await prisma.media.findMany({
      where: whereClause as any,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: {
        uploader: { select: { id: true, full_name: true, avatar_s3_key: true } },
        likes: userId ? { where: { user_id: userId } } : false,
        tags_in_media: { include: { tagged_user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } } } }
      }
    });

    const serialized = await Promise.all(media.map(async m => ({
      ...m,
      isLiked: m.likes ? m.likes.length > 0 : false,
      file_size_bytes: m.file_size_bytes.toString(),
      signed_url: await S3Service.generatePresignedDownloadUrl(m.s3_key)
    })));

    res.json({ 
      success: true, 
      data: serialized,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: skip + media.length < totalCount
      }
    });
  } catch (error) {
    console.error('Get event media error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch event media' });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const mediaId = req.params.id;
    const userId = (req as any).user?.id;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: { club: true }
    });

    if (!media) return res.status(404).json({ success: false, error: 'Media not found' });

    let canDelete = false;

    // Check if user is the uploader
    if (media.uploaded_by === userId) {
      canDelete = true;
    } else if (media.club_id) {
      // Check if user is club admin
      const membership = await prisma.clubMembership.findUnique({
        where: { user_id_club_id: { user_id: userId, club_id: media.club_id } }
      });
      if (membership && membership.role === 'admin' && membership.status === 'active') {
        canDelete = true;
      }
    }

    if (!canDelete) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this media' });
    }

    // In a real app we'd delete from S3 here too
    // await S3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: media.s3_key }));

    await prisma.media.delete({
      where: { id: mediaId }
    });

    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete media' });
  }
};

export async function processMediaAI(mediaId: string, s3Key: string) {
  console.log(`[AI] Starting processing for media: ${mediaId}`);
  const { RekognitionService } = await import('../../services/rekognition.service');
  
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) {
    console.log(`[AI] Media ${mediaId} not found`);
    return;
  }

  // AI processing is only for images (videos are not supported)
  if (media.file_type !== 'image') {
    console.log(`[AI] Skipping processing for media ${mediaId} as it is not an image.`);
    return;
  }

  // 1. Auto-tagging
  const tags = await RekognitionService.detectLabels(s3Key);
  if (tags.length > 0) {
    console.log(`[AI] Found tags for ${mediaId}:`, tags);
    await prisma.media.update({
      where: { id: mediaId },
      data: { ai_tags: tags },
    });
  }

  // 2. Face Detection & Matching
  const faceMatches = await RekognitionService.searchFacesInImage(s3Key);
  if (faceMatches.length > 0) {
    console.log(`[AI] Found ${faceMatches.length} faces for ${mediaId}`);
    for (const match of faceMatches) {
      if (!match.faceId) continue;
      
      await prisma.mediaFace.create({
        data: {
          media_id: mediaId,
          user_id: match.externalImageId || null,
          rekognition_face_id: match.faceId,
          confidence: match.confidence ? match.confidence : null,
          bounding_box: match.boundingBox ? (match.boundingBox as any) : null,
        }
      });
      console.log(`[AI] Saved face match for user ${match.externalImageId}`);
    }
  }
  console.log(`[AI] Finished processing for media: ${mediaId}`);
}

export const getMyPhotos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let allowedClubIds: string[] = [];
    const memberships = await prisma.clubMembership.findMany({
      where: { user_id: userId, status: 'active' },
      select: { club_id: true }
    });
    allowedClubIds = memberships.map(m => m.club_id);

    const mediaFaces = await prisma.mediaFace.findMany({
      where: { 
        user_id: userId,
        media: {
          OR: [
            { visibility: 'public' },
            { visibility: 'inherit' },
            {
              AND: [
                { visibility: 'club' },
                { club_id: { in: allowedClubIds } }
              ]
            }
          ]
        }
      },
      include: {
        media: {
          include: {
            likes: { where: { user_id: userId } },
            tags_in_media: { include: { tagged_user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } } } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const media = await Promise.all(mediaFaces.map(async mf => ({
      ...mf.media,
      isLiked: mf.media.likes ? mf.media.likes.length > 0 : false,
      file_size_bytes: mf.media.file_size_bytes.toString(),
      signed_url: await S3Service.generatePresignedDownloadUrl(mf.media.s3_key)
    })));

    res.json({ success: true, data: media });
  } catch (error) {
    console.error('Get My Photos Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch photos' });
  }
};

export const searchMedia = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string || '';
    const sort = req.query.sort as string || 'date_desc';
    const type = req.query.type as string || '';
    const startDate = req.query.startDate as string || '';
    const endDate = req.query.endDate as string || '';
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const userId = (req as any).user?.id;
    let allowedClubIds: string[] = [];

    if (userId) {
      const memberships = await prisma.clubMembership.findMany({
        where: { user_id: userId, status: 'active' },
        select: { club_id: true }
      });
      allowedClubIds = memberships.map(m => m.club_id);
    }

    let orderBy: any = { created_at: 'desc' };
    if (sort === 'date_asc') orderBy = { created_at: 'asc' };
    else if (sort === 'popular') orderBy = { like_count: 'desc' };

    const dateCondition: any = {};
    if (startDate || endDate) {
      dateCondition.created_at = {};
      if (startDate) dateCondition.created_at.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateCondition.created_at.lte = end;
      }
    }

    const whereClause = {
      AND: [
        type ? { file_type: type } : {},
        (startDate || endDate) ? dateCondition : {},
        q ? {
          OR: [
            { ai_tags: { hasSome: [q, q.toLowerCase(), q.charAt(0).toUpperCase() + q.slice(1).toLowerCase()] } },
            { event: { title: { contains: q, mode: 'insensitive' } } },
            { uploader: { username: { contains: q, mode: 'insensitive' } } }
          ]
        } : {}
      ],
      OR: [
        { visibility: 'public' },
        { visibility: 'inherit' },
        {
          AND: [
            { visibility: 'club' },
            { club_id: { in: allowedClubIds } }
          ]
        }
      ]
    };

    const totalCount = await prisma.media.count({ where: whereClause as any });

    const media = await prisma.media.findMany({
      where: whereClause as any,
      orderBy,
      skip,
      take: limit,
      include: {
        uploader: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } },
        club: { select: { id: true, name: true, slug: true } },
        event: { select: { id: true, title: true, slug: true } },
        likes: userId ? { where: { user_id: userId } } : false,
        tags_in_media: { include: { tagged_user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } } } }
      }
    });

    const serialized = await Promise.all(media.map(async m => ({
      ...m,
      isLiked: m.likes ? m.likes.length > 0 : false,
      file_size_bytes: m.file_size_bytes.toString(),
      signed_url: await S3Service.generatePresignedDownloadUrl(m.s3_key)
    })));

    res.json({ 
      success: true, 
      data: serialized,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasMore: skip + media.length < totalCount
      }
    });
  } catch (error) {
    console.error('Search Media Error:', error);
    res.status(500).json({ success: false, error: 'Failed to search media' });
  }
};

export const toggleFavourite = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const mediaId = req.params.id;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const existing = await prisma.favourite.findUnique({
      where: { user_id_media_id: { user_id: userId, media_id: mediaId } }
    });

    if (existing) {
      await prisma.favourite.delete({ where: { id: existing.id } });
      return res.json({ success: true, data: { isFavourited: false } });
    } else {
      await prisma.favourite.create({
        data: { user_id: userId, media_id: mediaId }
      });
      return res.json({ success: true, data: { isFavourited: true } });
    }
  } catch (error) {
    console.error('Toggle favourite error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle favourite' });
  }
};

export const getFavourites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const favourites = await prisma.favourite.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        media: {
          include: {
            uploader: { select: { id: true, full_name: true, avatar_s3_key: true } },
            event: { select: { id: true, title: true, slug: true } },
            likes: { where: { user_id: userId } },
            tags_in_media: { include: { tagged_user: { select: { id: true, full_name: true, username: true, avatar_s3_key: true } } } }
          }
        }
      }
    });

    const mediaList = await Promise.all(favourites.map(async f => ({
      ...f.media,
      isLiked: f.media.likes ? f.media.likes.length > 0 : false,
      file_size_bytes: f.media.file_size_bytes.toString(),
      is_favourited: true,
      signed_url: await S3Service.generatePresignedDownloadUrl(f.media.s3_key)
    })));

    res.json({ success: true, data: mediaList });
  } catch (error) {
    console.error('Get favourites error:', error);
    res.status(500).json({ success: false, error: 'Failed to get favourites' });
  }
};

export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const mediaId = req.params.id;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const existing = await prisma.like.findUnique({
      where: { user_id_media_id: { user_id: userId, media_id: mediaId } }
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      await prisma.media.update({
        where: { id: mediaId },
        data: { like_count: { decrement: 1 } }
      });
      return res.json({ success: true, data: { isLiked: false } });
    } else {
      await prisma.like.create({
        data: { user_id: userId, media_id: mediaId }
      });
      const media = await prisma.media.update({
        where: { id: mediaId },
        data: { like_count: { increment: 1 } },
        select: { uploaded_by: true, event: { select: { title: true } } }
      });

      // Notify the uploader
      const liker = await prisma.user.findUnique({ where: { id: userId }, select: { full_name: true } });
      if (liker && media && media.uploaded_by && media.uploaded_by !== userId) {
        const notification = await prisma.notification.create({
          data: {
            user_id: media.uploaded_by,
            type: 'like',
            actor_id: userId,
            entity_type: 'media',
            entity_id: mediaId,
            message: `${liker.full_name} liked your photo.`
          }
        });
        getIO().to(`user:${media.uploaded_by}`).emit('notification', notification);
      }

      return res.json({ success: true, data: { isLiked: true } });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle like' });
  }
};

export const trackDownload = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const mediaId = req.params.id;

    await prisma.download.create({
      data: {
        media_id: mediaId,
        user_id: userId || null,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
      }
    });

    await prisma.media.update({
      where: { id: mediaId },
      data: { download_count: { increment: 1 } }
    });

    res.json({ success: true, message: 'Download tracked' });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ success: false, error: 'Failed to track download' });
  }
};

export const downloadWatermarked = async (req: Request, res: Response) => {
  try {
    const mediaId = req.params.id;
    const userId = (req as any).user?.id;
    
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        club: { select: { name: true, watermark_text: true } },
        event: { select: { title: true } }
      }
    });

    if (!media) return res.status(404).json({ success: false, error: 'Media not found' });

    let roleText = 'Guest';
    if (userId && media.club_id) {
       const membership = await prisma.clubMembership.findUnique({
          where: { user_id_club_id: { user_id: userId, club_id: media.club_id } }
       });
       if (membership) roleText = membership.role;
    }

    const command = new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET_NAME || 'hareesh-project-uploads', Key: media.s3_key });
    const s3Response = await s3Client.send(command);
    if (!s3Response.Body) throw new Error("S3 Body empty");
    
    const imageBuffer = Buffer.from(await s3Response.Body.transformToByteArray());
    
    if (media.file_type === 'video') {
       const url = await S3Service.generatePresignedDownloadUrl(media.s3_key);
       
       await prisma.download.create({
         data: { media_id: mediaId, user_id: userId || null, ip_address: req.ip, user_agent: req.headers['user-agent'], watermark_applied: false }
       });
       await prisma.media.update({ where: { id: mediaId }, data: { download_count: { increment: 1 } } });
       
       return res.redirect(url);
    }
    
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;

    const fontSize = Math.max(24, Math.floor(width * 0.025));
    const padding = fontSize * 1.5;

    // We use inline SVG attributes instead of CSS because sharp's SVG renderer (librsvg) 
    // has limited support for complex CSS like text-shadow or linear gradients.
    // Drawing the text twice creates a perfectly reliable, crisp drop shadow.
    const svgImage = `
    <svg width="${width}" height="${height}">
      <!-- Shadow Layer -->
      <text x="${width - padding + 3}" y="${height - padding * 1.4 + 3}" text-anchor="end" fill="rgba(0,0,0,0.6)" font-size="${fontSize}px" font-family="Arial, Helvetica, sans-serif" font-weight="bold">${media.club?.name || 'Memoria'}</text>
      <text x="${width - padding + 2}" y="${height - padding * 0.6 + 2}" text-anchor="end" fill="rgba(0,0,0,0.6)" font-size="${Math.floor(fontSize * 0.6)}px" font-family="Arial, Helvetica, sans-serif" font-weight="bold">${media.event?.title || 'Gallery'} • Memoria</text>
      
      <!-- Text Layer -->
      <text x="${width - padding}" y="${height - padding * 1.4}" text-anchor="end" fill="rgba(255,255,255,0.95)" font-size="${fontSize}px" font-family="Arial, Helvetica, sans-serif" font-weight="bold">${media.club?.name || 'Memoria'}</text>
      <text x="${width - padding}" y="${height - padding * 0.6}" text-anchor="end" fill="rgba(255,255,255,0.85)" font-size="${Math.floor(fontSize * 0.6)}px" font-family="Arial, Helvetica, sans-serif" font-weight="bold">${media.event?.title || 'Gallery'} • Memoria</text>
    </svg>
    `;
    
    const svgBuffer = Buffer.from(svgImage);
    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .toBuffer();
      
    await prisma.download.create({
      data: { media_id: mediaId, user_id: userId || null, ip_address: req.ip, user_agent: req.headers['user-agent'], watermark_applied: true }
    });

    await prisma.media.update({
      where: { id: mediaId },
      data: { download_count: { increment: 1 } }
    });

    res.setHeader('Content-Type', media.mime_type || 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="watermarked_${media.original_filename}"`);
    res.send(watermarkedBuffer);
  } catch (error) {
     console.error('Watermark error:', error);
     res.status(500).json({ success: false, error: 'Failed to download' });
  }
};
