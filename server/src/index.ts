import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { initDB } from './db';
import importRoutes from './routes/import.routes';
import recordRoutes from './routes/record.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database before routes are registered
initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/import', importRoutes);
app.use('/api/records', recordRoutes);

// Centralized error-handling middleware (must be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'An internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});