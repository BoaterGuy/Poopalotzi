// Simple ESM-compatible server for Replit deployment
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service data for minimal deployment
const serviceLevels = [
  {
    id: 1,
    name: "Basic Pump-Out",
    description: "One-time pump-out service for single-head boats",
    priceInCents: 3500,
    serviceType: "one-time",
    serviceLevel: "single-head",
    isActive: true
  },
  {
    id: 2,
    name: "Premium Weekly",
    description: "Weekly scheduled pump-out service for multi-head boats",
    priceInCents: 12000,
    serviceType: "monthly",
    serviceLevel: "multi-head",
    isActive: true
  },
  {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited pump-outs for the entire season",
    priceInCents: 75000,
    serviceType: "seasonal",
    serviceLevel: "multi-head",
    isActive: true
  }
];

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint for service levels
app.get('/api/service-levels', (req, res) => {
  res.json(serviceLevels);
});

// Static file serving - adjust path for production build
const staticPath = path.join(process.cwd(), 'dist');
app.use(express.static(staticPath));

// Default route - serve the static HTML for SPA
app.get('*', (req, res) => {
  // First try to serve index.html from static directory
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;