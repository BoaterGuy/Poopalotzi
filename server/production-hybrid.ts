import express, { type Request, Response, NextFunction } from "express";
import path from "path";

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

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Marina Management System API ready' });
});

app.get('/api/user', (req, res) => {
  res.json({ user: null, authenticated: false });
});

app.get('/api/marinas', (req, res) => {
  res.json([]);
});

app.get('/api/boats', (req, res) => {
  res.json([]);
});

app.get('/api/service-levels', (req, res) => {
  res.json([]);
});

// Serve static files from client/dist
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
const clientPublicPath = path.resolve(process.cwd(), 'client/public');

try {
  app.use(express.static(clientDistPath));
  console.log("Serving client from dist directory");
} catch (err) {
  app.use(express.static(clientPublicPath));
  console.log("Serving client from public directory");
}

// Catch-all handler for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).send(`
        <html>
          <head><title>Marina Management System</title></head>
          <body>
            <h1>Marina Management System</h1>
            <p>Application ready - client files loading from: ${indexPath}</p>
          </body>
        </html>
      `);
    }
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Marina Management System running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});