import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import importRoutes from './routes/import.routes';
import recordRoutes from './routes/record.routes';
import exportRoutes from './routes/export.routes';
import tagRoutes from './routes/tag.routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/import', importRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/tags', tagRoutes);

// must be registered last so it catches errors from all routes
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error({ event: 'unhandled_error', message: err.message });
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`server listening on :${PORT}`);
});