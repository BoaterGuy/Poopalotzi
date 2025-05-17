
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

// Service data
const serviceLevels = [
  {
    id: 1,
    name: "Basic Pump-Out",
    description: "One-time pump-out service",
    priceInCents: 3500,
    serviceType: "one-time",
    serviceLevel: "single-head",
    isActive: true
  },
  {
    id: 2,
    name: "Premium Weekly",
    description: "Weekly scheduled pump-out service",
    priceInCents: 12000,
    serviceType: "monthly",
    serviceLevel: "multi-head",
    isActive: true
  }
];

app.get('/api/service-levels', (req, res) => {
  res.json(serviceLevels);
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'client', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
});

export default app;
