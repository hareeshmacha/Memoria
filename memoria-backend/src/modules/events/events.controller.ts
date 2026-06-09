import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export class EventsController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await prisma.event.findMany({
        where: { visibility: 'public' },
        include: { club: true },
        orderBy: { event_date: 'desc' }
      });
      res.status(200).json({ data: events });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await prisma.event.create({
        data: {
          ...req.body,
          created_by: req.user?.id,
        },
      });
      res.status(201).json({ data: event });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      const { title, slug, description, event_date, category } = req.body;
      
      const event = await prisma.event.update({
        where: { id: eventId },
        data: { title, slug, description, event_date, category }
      });
      res.status(200).json({ data: event });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const eventId = req.params.id;
      await prisma.event.delete({
        where: { id: eventId }
      });
      res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
