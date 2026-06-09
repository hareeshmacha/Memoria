import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const createClubSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'photographer', 'member']),
});

export class ClubsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const clubs = await prisma.club.findMany({
        where: { is_public: true },
        orderBy: { created_at: 'desc' }
      });
      res.status(200).json({ data: clubs });
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const club = await prisma.club.findUnique({
        where: { slug: req.params.slug }
      });
      if (!club) return res.status(404).json({ error: 'Club not found' });
      res.status(200).json({ data: club });
    } catch (error) {
      next(error);
    }
  }

  static async getMyClubs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const memberships = await prisma.clubMembership.findMany({
        where: { user_id: userId },
        include: { club: true }
      });
      res.status(200).json({ data: memberships });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = createClubSchema.parse(req.body);

      // Create club and add the creator as an admin in a transaction
      const club = await prisma.$transaction(async (tx) => {
        const newClub = await tx.club.create({
          data: {
            ...data,
            created_by: userId,
          },
        });

        await tx.clubMembership.create({
          data: {
            user_id: userId,
            club_id: newClub.id,
            role: 'admin',
          }
        });

        return newClub;
      });

      res.status(201).json({ data: club });
    } catch (error) {
      next(error);
    }
  }

  static async updateClub(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const { name, slug, description } = req.body;
      
      const club = await prisma.club.update({
        where: { id: clubId },
        data: { name, slug, description }
      });
      res.status(200).json({ data: club });
    } catch (error) {
      next(error);
    }
  }

  static async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const members = await prisma.clubMembership.findMany({
        where: { club_id: clubId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              username: true,
              email: true,
              avatar_s3_key: true
            }
          }
        }
      });
      res.status(200).json({ data: members });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const { email, role } = addMemberSchema.parse(req.body);
      const requesterId = (req as any).user.id;

      // Verify requester is admin
      const requesterMembership = await prisma.clubMembership.findUnique({
        where: {
          user_id_club_id: {
            user_id: requesterId,
            club_id: clubId,
          }
        }
      });

      if (!requesterMembership || requesterMembership.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can add members' });
      }

      // Find user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email }
      });

      if (!userToAdd) {
        return res.status(404).json({ success: false, error: 'User not found with that email' });
      }

      if (userToAdd.id === requesterId) {
        return res.status(400).json({ success: false, error: 'You cannot modify your own role' });
      }

      // Upsert membership
      const membership = await prisma.clubMembership.upsert({
        where: {
          user_id_club_id: {
            user_id: userToAdd.id,
            club_id: clubId,
          }
        },
        update: { role },
        create: {
          user_id: userToAdd.id,
          club_id: clubId,
          role,
          invited_by: requesterId
        }
      });

      const club = await prisma.club.findUnique({ where: { id: clubId } });
      await prisma.notification.create({
        data: {
          user_id: userToAdd.id,
          type: 'club_invite',
          actor_id: requesterId,
          entity_type: 'club',
          entity_id: clubId,
          message: `You have been added to ${club?.name} as a ${role}.`
        }
      });

      res.status(200).json({ data: membership });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const userId = req.params.userId;
      
      await prisma.clubMembership.delete({
        where: {
          user_id_club_id: { user_id: userId, club_id: clubId }
        }
      });
      res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const userId = req.params.userId;
      const { role } = req.body;
      
      const membership = await prisma.clubMembership.update({
        where: {
          user_id_club_id: { user_id: userId, club_id: clubId }
        },
        data: { role }
      });
      res.status(200).json({ data: membership });
    } catch (error) {
      next(error);
    }
  }

  static async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const sort = req.query.sort as string || 'date_desc';
      
      let orderBy: any = { event_date: 'desc' };
      if (sort === 'name_asc') orderBy = { title: 'asc' };
      else if (sort === 'category') orderBy = { category: 'asc' };

      const events = await prisma.event.findMany({
        where: { club_id: clubId },
        orderBy
      });
      res.status(200).json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  static async getEventsBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = req.params.slug;
      const sort = req.query.sort as string || 'date_desc';

      const club = await prisma.club.findUnique({ where: { slug } });
      if (!club) return res.status(404).json({ error: 'Club not found' });
      
      let orderBy: any = { event_date: 'desc' };
      if (sort === 'name_asc') orderBy = { title: 'asc' };
      else if (sort === 'category') orderBy = { category: 'asc' };

      const events = await prisma.event.findMany({
        where: { club_id: club.id },
        orderBy
      });
      res.status(200).json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  static async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const userId = (req as any).user.id;
      
      // Verify role
      const membership = await prisma.clubMembership.findUnique({
        where: {
          user_id_club_id: { user_id: userId, club_id: clubId }
        }
      });

      if (!membership || (membership.role !== 'admin' && membership.role !== 'photographer')) {
        return res.status(403).json({ success: false, error: 'Not authorized to create events for this club' });
      }

      const event = await prisma.event.create({
        data: {
          title: req.body.title,
          slug: req.body.slug,
          category: req.body.category || 'General',
          description: req.body.description,
          club_id: clubId,
          created_by: userId,
          event_date: new Date(req.body.event_date)
        }
      });

      res.status(201).json({ data: event });
    } catch (error) {
      next(error);
    }
  }
  static async joinRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const userId = (req as any).user.id;

      const existing = await prisma.clubMembership.findUnique({
        where: { user_id_club_id: { user_id: userId, club_id: clubId } }
      });

      if (existing) {
        return res.status(400).json({ success: false, error: 'Membership or request already exists' });
      }

      const membership = await prisma.clubMembership.create({
        data: {
          user_id: userId,
          club_id: clubId,
          role: 'member',
          status: 'pending'
        }
      });

      res.status(201).json({ data: membership });
    } catch (error) {
      next(error);
    }
  }

  static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const requesterId = (req as any).user.id;

      // Verify admin
      const adminCheck = await prisma.clubMembership.findUnique({
        where: { user_id_club_id: { user_id: requesterId, club_id: clubId } }
      });

      if (!adminCheck || adminCheck.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can view requests' });
      }

      const requests = await prisma.clubMembership.findMany({
        where: { club_id: clubId, status: 'pending' },
        include: {
          user: {
            select: { id: true, full_name: true, email: true, avatar_s3_key: true }
          }
        }
      });

      res.status(200).json({ data: requests });
    } catch (error) {
      next(error);
    }
  }

  static async approveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const targetUserId = req.params.userId;
      const requesterId = (req as any).user.id;

      // Verify admin
      const adminCheck = await prisma.clubMembership.findUnique({
        where: { user_id_club_id: { user_id: requesterId, club_id: clubId } }
      });

      if (!adminCheck || adminCheck.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can approve requests' });
      }

      const membership = await prisma.clubMembership.update({
        where: { user_id_club_id: { user_id: targetUserId, club_id: clubId } },
        data: { status: 'active' },
        include: { club: true }
      });

      await prisma.notification.create({
        data: {
          user_id: targetUserId,
          type: 'club_approved',
          actor_id: requesterId,
          entity_type: 'club',
          entity_id: clubId,
          message: `Your request to join ${membership.club.name} has been approved.`
        }
      });

      res.status(200).json({ data: membership });
    } catch (error) {
      next(error);
    }
  }

  static async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const clubId = req.params.id;
      const targetUserId = req.params.userId;
      const requesterId = (req as any).user.id;

      // Verify admin
      const adminCheck = await prisma.clubMembership.findUnique({
        where: { user_id_club_id: { user_id: requesterId, club_id: clubId } }
      });

      if (!adminCheck || adminCheck.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admins can reject requests' });
      }

      await prisma.clubMembership.delete({
        where: { user_id_club_id: { user_id: targetUserId, club_id: clubId } }
      });

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
