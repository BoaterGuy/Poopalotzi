import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { IStorage } from "./storage";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  
  res.json = function (body: any) {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
    return originalJson.call(this, body);
  };
  
  next();
});

async function startServer() {
  console.log("Setting up database...");
  await setupFullDatabase();
  
  console.log("Setting up authentication...");
  setupAuth(app);
  
  console.log("Registering routes...");
  const server = await registerRoutes(app);
  
  // Serve static files from client/public as fallback
  const clientPublicPath = path.join(__dirname, '../client/public');
  const clientDistPath = path.join(__dirname, '../client/dist');
  
  // Try to serve from dist first, fallback to public
  try {
    app.use(express.static(clientDistPath));
    console.log("Serving client from dist directory");
  } catch (err) {
    app.use(express.static(clientPublicPath));
    console.log("Serving client from public directory");
  }
  
  // Catch-all handler for SPA
  app.get('*', (req, res) => {
    try {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    } catch (err) {
      res.sendFile(path.join(clientPublicPath, 'index.html'));
    }
  });
  
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Poopalotzi server running on port ${PORT}`);
  });
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});