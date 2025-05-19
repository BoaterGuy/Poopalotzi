
import express from 'express';
import path from 'path';
import cors from 'cors';
import { setupAuth } from './auth.js';
import { registerRoutes } from './routes.js';
import { storage as memStorage } from './storage.js';

const app = express();
const port = parseInt(process.env.PORT ?? "5000", 10);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(process.cwd(), 'dist', 'public')));

async function init() {
  try {
    console.log('Using in-memory storage for production');
    
    // Setup auth and routes
    await setupAuth(app);
    await registerRoutes(app);
    
    // Error handler
    app.use((err: any, _req: any, res: any, _next: any) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // SPA fallback
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Production server running at http://0.0.0.0:${PORT}`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

init();

export default app;
