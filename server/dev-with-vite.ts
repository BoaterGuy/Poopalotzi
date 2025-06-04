import express from "express";
import { createServer } from "vite";
import { registerRoutes } from "./routes.js";
import { setupFullDatabase } from "./setup-database.js";
import { setupAuth } from "./auth.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevServer() {
  const app = express();
  
  // JSON middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Database setup
  console.log("Setting up database...");
  await setupFullDatabase();
  
  // Authentication setup
  console.log("Setting up authentication...");
  setupAuth(app);
  
  // API routes
  console.log("Setting up API routes...");
  await registerRoutes(app);
  
  // Create Vite server in development mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    root: path.resolve(__dirname, '../client'),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, '../client/src'),
        "@shared": path.resolve(__dirname, '../shared'),
        "@assets": path.resolve(__dirname, '../attached_assets'),
      },
    },
  });
  
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);
  
  // Serve the app
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    try {
      const template = await vite.transformIndexHtml(url, `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <meta name="description" content="Schedule boat pump-outs, track services, and maintain your vessel with ease. The modern solution for boat owners." />
    <meta name="theme-color" content="#0B1F3A" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" href="/logo192.png" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>Poopalotzi - Boat Pump-Out Management</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="Poopalotzi - Boat Pump-Out Management" />
    <meta property="og:description" content="Schedule boat pump-outs, track services, and maintain your vessel with ease. The modern solution for boat owners." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://poopalotzi.com" />
    <meta property="og:image" content="/logo512.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
      `);
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marina Management System with Vite running on port ${PORT}`);
  });
}

startDevServer().catch(console.error);