import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { initDB } from './db';
import importRoutes from './routes/import.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/import', importRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('An error occurred:', err);
    res.status(500).json({ error: 'An internal server error occurred' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});