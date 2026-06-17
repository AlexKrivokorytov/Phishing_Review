import path from 'path';

export const config = {
  db: {
    defaultPath: path.resolve(__dirname, '../../../database.db'),
    memoryPath: ':memory:',
    initialTags: [
      'suspicious_domain',
      'credential_form',
      'url_shortener',
      'brand_impersonation',
      'suspicious_attachment_reference',
    ],
  },
  server: {
    defaultPort: 3001,
  },
};
