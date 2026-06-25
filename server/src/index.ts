import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';

import exportRoutes from './routes/export.routes';
import importRoutes from './routes/import.routes';
import recordRoutes from './routes/record.routes';
import tagRoutes from './routes/tag.routes';
import configRoutes from './routes/config.routes';
import { config } from './config';
import { logger } from './utils/logger';
import { HttpError } from './utils/errors';

const app = express();
const PORT = Number(process.env.PORT ?? config.server.defaultPort) || config.server.defaultPort;

app.use(cors());
app.use(express.json());

app.use(config.routes.import, importRoutes);
app.use(config.routes.records, recordRoutes);
app.use(config.routes.export, exportRoutes);
app.use(config.routes.tags, tagRoutes);
app.use(config.routes.config, configRoutes);

// must be registered last so it catches errors from all routes
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  logger.error('unhandled_error', err, { method: req.method, url: req.url });
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  logger.info('server_started', { port: PORT });
});