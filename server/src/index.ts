import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';

import exportRoutes from './routes/export.routes';
import importRoutes from './routes/import.routes';
import recordRoutes from './routes/record.routes';
import tagRoutes from './routes/tag.routes';
import configRoutes from './routes/config.routes';
import { config } from './config';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || config.server.defaultPort;

app.use(cors());
app.use(express.json());

app.use('/api/import', importRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/config', configRoutes);

// must be registered last so it catches errors from all routes
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('unhandled_error', err, { method: req.method, url: req.url });
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  logger.info('server_started', { port: Number(PORT) });
});