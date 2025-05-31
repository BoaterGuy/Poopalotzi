import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupFullDatabase } from "./setup-database";
import { DatabaseStorage } from "./database-storage";
import { storage as memStorage, IStorage } from "./storage";
import { setupAuth } from "./auth";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a database storage instance
const dbStorage = new DatabaseStorage();
export let storage: IStorage = dbStorage;

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Setup authentication
setupAuth(app);

const formatDateForRequest = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  try {
    // Setup database
    await setupFullDatabase();
    console.log("Database setup completed");

    // Register API routes
    const server = await registerRoutes(app);
    console.log("Routes registered");

    // Serve static files from client/dist
    const clientDistPath = path.join(process.cwd(), 'client', 'dist');
    app.use(express.static(clientDistPath));

    // Catch-all handler for SPA
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ message: 'API endpoint not found' });
      } else {
        const indexPath = path.join(clientDistPath, 'index.html');
        try {
          res.sendFile(indexPath);
        } catch (error) {
          res.status(404).send('Frontend not built. Run npm run build first.');
        }
      }
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", err);
      if (res.headersSent) return;
      res.status(500).json({ 
        error: "Internal server error",
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`Poopalotzi server running on port ${port}`);
      console.log(`Image upload system ready at /uploads`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();