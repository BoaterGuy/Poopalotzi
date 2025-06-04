import { createServer } from 'vite';
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevServer() {
  const app = express();
  
  // JSON middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Import and setup backend modules
  try {
    const { setupFullDatabase } = await import('./server/setup-database.js');
    const { setupAuth } = await import('./server/auth.js');
    const { registerRoutes } = await import('./server/routes.js');
    
    console.log("Setting up database...");
    await setupFullDatabase();
    
    console.log("Setting up authentication...");
    setupAuth(app);
    
    console.log("Registering API routes...");
    await registerRoutes(app);
    
  } catch (error) {
    console.log("Backend modules not available, starting frontend only");
  }

  // Create Vite server
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: path.resolve(__dirname, 'client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'client/src'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@assets': path.resolve(__dirname, 'attached_assets'),
      },
    },
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marina Management System with full React frontend running on port ${PORT}`);
  });
}

startDevServer().catch(console.error);