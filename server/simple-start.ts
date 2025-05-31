import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { DatabaseStorage } from "./database-storage";
import type { IStorage } from "./storage";
import path from "path";
import fs from "fs";

const app = express();

// Create database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Basic middleware with file upload support
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

const formatDateForRequest = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

async function startServer() {
  try {
    console.log("Starting Poopalotzi server...");
    
    // Set up authentication
    setupAuth(app);
    
    // Register API routes
    const server = await registerRoutes(app);

    // Error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err.message);
      if (res.headersSent) return;
      res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    const port = Number(process.env.PORT) || 5000;
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
      console.log(`Frontend: http://localhost:${port}`);
      console.log(`API: http://localhost:${port}/api`);
      console.log(`Image uploads: Ready (${uploadsDir})`);
    });

  } catch (error: any) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

startServer();