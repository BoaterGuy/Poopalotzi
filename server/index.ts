
<old_str>

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import { setupAuth } from './auth.js';
import { setupRoutes } from './routes.js';
import { setupDatabase } from './setup-database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Setup authentication
setupAuth();

// Setup database
setupDatabase();

// Setup API routes
setupRoutes(app);

// Serve static files from client/dist
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// SPA catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚤 Poopalotzi server running on port ${PORT}`);
});
</old_str>
<new_str>
// Use the working standalone server
import './standalone.js';
</new_str>
