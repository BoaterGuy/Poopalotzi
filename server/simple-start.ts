import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from React build
const clientPath = path.resolve(process.cwd(), 'client/dist');
app.use(express.static(clientPath));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

// Catch-all handler for React app
app.get('*', (req, res) => {
  const indexPath = path.join(clientPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).send(`
        <html>
          <head><title>Marina Management System</title></head>
          <body>
            <h1>🚤 Marina Management System</h1>
            <p>Application is running but client files not found.</p>
            <p>Expected path: ${indexPath}</p>
          </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Marina Management System running on port ${PORT}`);
});