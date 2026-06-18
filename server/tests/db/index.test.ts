import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseFactory } from '../../src/db/index';
import { config } from '../../src/config';

describe('DatabaseFactory', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalDbPath = process.env.DB_PATH;

  afterEach(() => {
    DatabaseFactory.resetConnection();
    process.env.NODE_ENV = originalEnv;
    if (originalDbPath === undefined) {
      delete process.env.DB_PATH;
    } else {
      process.env.DB_PATH = originalDbPath;
    }
  });

  it('uses memoryPath when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    const db = DatabaseFactory.getConnection();
    expect(db.name).toBe(':memory:');
  });

  it('uses config.db.defaultPath when NODE_ENV is not test and DB_PATH is not set', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DB_PATH;
    const db = DatabaseFactory.getConnection();
    expect(db.name.endsWith('database.db')).toBe(true);
  });

  it('uses DB_PATH when provided and NODE_ENV is not test', () => {
    process.env.NODE_ENV = 'development';
    process.env.DB_PATH = ':memory:'; // Use memory so we don't create a real file
    const db = DatabaseFactory.getConnection();
    expect(db.name).toBe(':memory:');
  });
});
