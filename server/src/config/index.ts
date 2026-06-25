import path from 'path';
import { INITIAL_TAGS } from './constants';

export const config = {
  db: {
    defaultPath: path.resolve(__dirname, '../../../database.db'),
    memoryPath: ':memory:',
    initialTags: INITIAL_TAGS,
  },
  server: {
    defaultPort: 3001,
  },
  routes: {
    import: '/api/import',
    records: '/api/records',
    export: '/api/export',
    tags: '/api/tags',
    config: '/api/config',
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
  },
  export: {
    prefix: process.env.EXPORT_PREFIX || 'phishguard-export-',
  },
  import: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads/',
  }
};
