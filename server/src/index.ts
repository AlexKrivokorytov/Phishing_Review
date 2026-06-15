import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { initDB } from './db';
import importRoutes from './routes/import.routes';
import recordRoutes from './routes/record.routes';
import exportRoutes from './routes/export.routes';

const app = express();
const PORT = process.env.PORT || 3001;

initDB();

app.use(cors());
app.use(express.json());

app.use('/api/import', importRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/export', exportRoutes);

// must be registered last so it catches errors from all routes
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error({ event: 'unhandled_error', message: err.message });
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`server listening on :${PORT}`);
});