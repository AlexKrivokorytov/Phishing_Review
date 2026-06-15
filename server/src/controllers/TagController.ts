import type { Request, Response } from 'express';
import type { TagRepository } from '../repositories/TagRepository';

export class TagController {
  constructor(private readonly tagRepo: TagRepository) {}

  public getAllTags = (req: Request, res: Response): void => {
    try {
      const tags = this.tagRepo.findAll();
      res.json(tags);
    } catch (err: unknown) {
      console.error('[TagController] Error fetching tags:', err);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  };
}
