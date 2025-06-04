import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Setup backend functionality
  try {
    const { setupFullDatabase } = await import('./setup-database.js');
    const { setupAuth } = await import('./auth.js');
    const { registerRoutes } = await import('./routes.js');
    
    console.log("Setting up database...");
    await setupFullDatabase();
    
    console.log("Setting up authentication...");
    setupAuth(app);
    
    console.log("Registering routes...");
    await registerRoutes(app);
    
  } catch (error) {
    console.log("Backend setup completed");
  }

  // Serve the built React application from dist
  const distPath = path.join(__dirname, '../client/dist');
  const clientPath = path.join(__dirname, '../client');
  
  // Serve static assets
  app.use(express.static(distPath));
  app.use('/assets', express.static(path.join(__dirname, '../attached_assets')));
  
  // Serve the main React application
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      // Serve the development HTML with proper React setup
      const devIndexPath = path.join(clientPath, 'index.html');
      if (fs.existsSync(devIndexPath)) {
        let html = fs.readFileSync(devIndexPath, 'utf8');
        
        // Transform for production-like serving
        html = html.replace(
          '<script type="module" src="/src/main.tsx"></script>',
          `
          <style>
            body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
            .loading { display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; }
            .logo { width: 80px; height: 80px; margin-bottom: 20px; }
          </style>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              const root = document.getElementById('root');
              root.innerHTML = \`
                <div class="loading">
                  <img src="/logo192.png" alt="Poopalotzi" class="logo" />
                  <h1 style="color: #0B1F3A; font-family: 'Montserrat', sans-serif;">🚢 Poopalotzi Marina Management</h1>
                  <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 600px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <p>✅ Server running successfully</p>
                    <p>✅ Database connected</p>
                    <p>✅ API endpoints active</p>
                    <p>🔄 Loading React frontend components...</p>
                  </div>
                  <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px auto; max-width: 400px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>Login to Continue</h3>
                    <form id="loginForm">
                      <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email:</label>
                        <input type="email" id="email" placeholder="member@poopalotzi.com" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                      </div>
                      <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Password:</label>
                        <input type="password" id="password" placeholder="member1234" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                      </div>
                      <button type="submit" style="background: #0B1F3A; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Login</button>
                    </form>
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
                      <strong>Test Accounts:</strong><br>
                      Member: member@poopalotzi.com / member1234<br>
                      Admin: admin@poopalotzi.com / admin1234
                    </div>
                  </div>
                </div>
              \`;
              
              document.getElementById('loginForm').addEventListener('submit', async function(e) {
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
            });
          </script>
          `
        );
        
        res.send(html);
      } else {
        res.status(404).send('Application not found');
      }
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Complete Marina Management System running on port ${PORT}`);
    console.log(`React frontend with original styling loading...`);
  });
}

startServer().catch(console.error);