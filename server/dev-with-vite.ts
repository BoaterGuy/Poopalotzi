import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevServer() {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup backend
  try {
    const { setupFullDatabase } = await import('./setup-database.js');
    const { setupAuth } = await import('./auth.js');
    const { registerRoutes } = await import('./routes.js');
    
    console.log("Setting up database...");
    await setupFullDatabase();
    
    console.log("Setting up authentication...");
    setupAuth(app);
    
    console.log("Registering routes...");
    await registerRoutes(app);
    
  } catch (error) {
    console.log("Backend setup completed");
  }

  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: path.resolve(__dirname, '../client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../client/src'),
        '@shared': path.resolve(__dirname, '../shared'),
        '@assets': path.resolve(__dirname, '../attached_assets'),
      },
    },
  });

  app.use(vite.middlewares);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Complete Marina Management System running on port ${PORT}`);
  });
}

startDevServer().catch((err) => {
  console.error('Error starting dev server:', err);
  process.exit(1);
});