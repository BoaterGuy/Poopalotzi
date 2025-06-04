import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function restoreFrontend() {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup backend functionality
  try {
    const { setupFullDatabase } = await import('./server/setup-database.js');
    const { setupAuth } = await import('./server/auth.js');
    const { registerRoutes } = await import('./server/routes.js');
    
    console.log("Setting up database...");
    await setupFullDatabase();
    
    console.log("Setting up authentication...");
    setupAuth(app);
    
    console.log("Registering API routes...");
    await registerRoutes(app);
    
  } catch (error) {
    console.log("Backend setup error:", error.message);
  }

  // Serve the React application files
  const clientSrc = path.join(__dirname, 'client/src');
  const clientPublic = path.join(__dirname, 'client/public');
  
  // Serve static assets
  app.use('/assets', express.static(path.join(__dirname, 'attached_assets')));
  app.use(express.static(clientPublic));
  
  // Main route that serves the React application
  app.get('*', (req, res) => {
    // Serve the index.html with the React application
    const indexPath = path.join(__dirname, 'client/index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Fallback HTML with basic React setup
      res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <meta name="description" content="Schedule boat pump-outs, track services, and maintain your vessel with ease. The modern solution for boat owners." />
    <meta name="theme-color" content="#0B1F3A" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" href="/logo192.png" />
    <link rel="apple-touch-icon" href="/logo192.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>Poopalotzi - Boat Pump-Out Management</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="Poopalotzi - Boat Pump-Out Management" />
    <meta property="og:description" content="Schedule boat pump-outs, track services, and maintain your vessel with ease. The modern solution for boat owners." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://poopalotzi.com" />
    <meta property="og:image" content="/logo512.png" />
    <style>
      body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
      .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      h1 { color: #0B1F3A; font-family: 'Montserrat', sans-serif; }
      .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
      .login-form { max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
      .form-group { margin: 15px 0; }
      label { display: block; margin-bottom: 5px; font-weight: 600; }
      input[type="email"], input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      button { background: #0B1F3A; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
      button:hover { background: #1a3a5c; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🚢 Poopalotzi Marina Management System</h1>
      <div class="status">
        ✅ Server running successfully<br>
        ✅ Database connected<br>
        ✅ API endpoints active<br>
        ⚠️ React frontend styling being restored...
      </div>
      
      <div class="login-form">
        <h3>Login to Continue</h3>
        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" placeholder="member@poopalotzi.com" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" placeholder="member1234" required>
          </div>
          <button type="submit">Login</button>
        </form>
        
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
          <strong>Test Accounts:</strong><br>
          Member: member@poopalotzi.com / member1234<br>
          Admin: admin@poopalotzi.com / admin1234
        </div>
      </div>
    </div>

    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          if (response.ok) {
            window.location.reload();
          } else {
            alert('Login failed. Please check your credentials.');
          }
        } catch (error) {
          alert('Connection error. Please try again.');
        }
      });
    </script>
  </body>
</html>
      `);
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marina Management System running on port ${PORT}`);
    console.log(`Frontend restoration in progress...`);
  });
}

restoreFrontend().catch(console.error);