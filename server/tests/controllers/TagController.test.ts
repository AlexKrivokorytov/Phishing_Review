import { describe, it, expect, vi } from 'vitest';
import { TagController } from '../../src/controllers/TagController';
import { TagRepository } from '../../src/repositories/TagRepository';
import type { Request, Response, NextFunction } from 'express';

describe('TagController', () => {
  const mockTagRepo = {
    findAll: vi.fn(),
  } as unknown as TagRepository;

  const controller = new TagController(mockTagRepo);

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();
    return res as Response;
  };

  it('getAllTags returns tags from repository', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();

    const tags = [{ id: 1, name: 'tag1' }];
    vi.mocked(mockTagRepo.findAll).mockReturnValueOnce(tags);

    controller.getAllTags(req, res, next);

    expect(mockTagRepo.findAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(tags);
  });

  it('getAllTags calls next on error', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn();

    vi.mocked(mockTagRepo.findAll).mockImplementationOnce(() => { throw new Error('DB Error'); });

    controller.getAllTags(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
