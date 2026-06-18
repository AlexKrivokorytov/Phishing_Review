import { logger } from '../../src/utils/logger';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('should have info, error, and warn methods', () => {
    logger.info('Test info message', { test: true });
    expect(console.log).toHaveBeenCalled();
    logger.warn('Test warn message');
    expect(console.warn).toHaveBeenCalled();
    logger.error('Test error message string', 'test error string');
    expect(console.error).toHaveBeenCalled();
    logger.error('Test error message obj', new Error('test error obj'));
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});
