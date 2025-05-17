import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(process.cwd(), 'dist', 'client')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'client', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
});

export default app;