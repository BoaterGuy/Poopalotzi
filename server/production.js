const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const app = express();
const port = parseInt(process.env.PORT || '5000');

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Session handling
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from the React app
app.use(express.static(path.join(process.cwd(), 'dist', 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${port}`);
});