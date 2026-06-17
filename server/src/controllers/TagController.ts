import type { Request, Response, NextFunction } from 'express';
import type { TagRepository } from '../repositories/TagRepository';

// Controller to handle evidence tag requests.
export class TagController {
  constructor(private readonly tagRepo: TagRepository) {}

  // Gets all available tags.
  public getAllTags(req: Request, res: Response, next: NextFunction): void {
    try {
      const tags = this.tagRepo.findAll();
      res.status(200).json(tags);
    } catch (err: unknown) {
      next(err);
    }
  }
}
