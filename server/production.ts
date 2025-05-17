/**
 * This file provides a CommonJS compatible entry point for production deployments
 */
import express from "express";
import { serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { storage as memStorage } from "./storage";
import cors from "cors";

// Create express app
const app = express();

// Configure middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup authentication
setupAuth(app);

// Simple startup function that doesn't use top-level await
async function startServer() {
  try {
    // Initialize data
    console.log("Using memory storage for production");
    
    // Register API routes
    const server = await registerRoutes(app);
    
    // Serve static files for the frontend
    serveStatic(app);
    
    // Start the server
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;