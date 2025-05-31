import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { IStorage } from "./storage";
import { setupAuth } from "./auth";

// Create a database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      console.log(logLine);
    }
  });

  next();
});

const formatDateForRequest = (date: Date): string => {
  return date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
};

async function startServer() {
  const port = Number(process.env.PORT || 3000);

  try {
    // Set up the database first
    console.log("Setting up database...");
    await setupFullDatabase();
    console.log("Database setup complete");

    // Set up authentication
    setupAuth(app);
    
    // Register all routes
    const server = await registerRoutes(app);

    // Start the server
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error(err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}