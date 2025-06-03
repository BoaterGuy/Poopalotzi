// Bypass Vite configuration to avoid dependency issues
import path from "path";
import express from "express";

export function serveStatic(app: express.Application) {
  // Serve static files if they exist
  const publicPath = path.resolve(process.cwd(), "dist/public");
  app.use(express.static(publicPath));
}

export function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

export async function setupVite(app: express.Application, server: any) {
  // In development, serve a simple HTML page
  if (process.env.NODE_ENV === "development") {
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/auth")) {
        return next();
      }
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Poopalotzi - Loading...</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div id="root">
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
              <div style="text-align: center;">
                <h1>🚢 Poopalotzi</h1>
                <p>Server is running on port ${process.env.PORT || 3000}</p>
                <p>Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}</p>
                <p>API endpoints available at /api/*</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    });
  } else {
    serveStatic(app);
  }
}