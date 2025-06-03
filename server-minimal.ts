import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./server/routes";
import { setupFullDatabase } from "./server/setup-database";
import { DatabaseStorage } from "./server/database-storage";
import { IStorage } from "./server/storage";
import { setupAuth } from "./server/auth";

const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    if (path.startsWith("/api") || path.startsWith("/auth")) {
      console.log(`${req.method} ${path} ${status} in ${duration}ms :: ${
        capturedJsonResponse ? JSON.stringify(capturedJsonResponse) : ""
      }`);
    }
  });

  next();
});

async function startServer() {
  const port = parseInt(process.env.PORT || "3000", 10);

  try {
    console.log("Setting up database...");
    await setupFullDatabase();
    console.log("Database setup complete");

    console.log("Setting up authentication...");
    setupAuth(app);
    console.log("Authentication setup complete");

    console.log("Registering routes...");
    const server = await registerRoutes(app);
    console.log("Routes registered");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error(`Error ${status}: ${message}`);
      res.status(status).json({ message });
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
      console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'No DATABASE_URL'}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();