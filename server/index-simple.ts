import express from "express";
import { setupDatabase } from "./db.js";
import { setupAuth } from "./auth.js";
import { registerRoutes } from "./routes.js";
import { storage } from "./index.js";

const app = express();
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("Setting up database connection...");
    await setupDatabase();
    
    console.log("Setting up authentication...");
    setupAuth(app);
    
    console.log("Registering routes...");
    await registerRoutes(app);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();