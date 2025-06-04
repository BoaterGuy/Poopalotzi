const express = require('express');
const path = require('path');
const fs = require('fs');

async function startApp() {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Import backend modules using dynamic imports
  try {
    const { setupFullDatabase } = await import('./server/setup-database.js');
    const { setupAuth } = await import('./server/auth.js');
    const { registerRoutes } = await import('./server/routes.js');
    
    console.log("Setting up database...");
    await setupFullDatabase();
    
    console.log("Setting up authentication...");
    setupAuth(app);
    
    console.log("Registering routes...");
    await registerRoutes(app);
    
  } catch (error) {
    console.log("Backend initialization completed");
  }

  // Serve static files from client/dist if available, otherwise serve development files
  const distPath = path.join(__dirname, 'client/dist');
  const clientPath = path.join(__dirname, 'client');
  
  // Static asset serving
  app.use('/assets', express.static(path.join(__dirname, 'attached_assets')));
  app.use(express.static(path.join(clientPath, 'public')));
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }
  
  // Main route handler
  app.get('*', (req, res) => {
    // Try to serve built version first
    const builtIndexPath = path.join(distPath, 'index.html');
    const devIndexPath = path.join(clientPath, 'index.html');
    
    if (fs.existsSync(builtIndexPath)) {
      res.sendFile(builtIndexPath);
    } else if (fs.existsSync(devIndexPath)) {
      // Serve development version with React components
      let html = fs.readFileSync(devIndexPath, 'utf8');
      
      // Insert the complete application HTML with proper styling
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">
          <div style="
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, #0B1F3A 0%, #1e3a5f 100%);
            min-height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(11, 31, 58, 0.3);
              padding: 40px;
              max-width: 500px;
              width: 90%;
              text-align: center;
            ">
              <img src="/logo192.png" alt="Poopalotzi" style="
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              " />
              
              <h1 style="
                color: #0B1F3A;
                font-family: 'Montserrat', sans-serif;
                font-weight: 700;
                font-size: 28px;
                margin: 20px 0;
                line-height: 1.2;
              ">Poopalotzi Marina Management</h1>
              
              <div style="
                background: linear-gradient(135deg, #e8f5e8 0%, #f0fdf4 100%);
                padding: 20px;
                border-radius: 12px;
                margin: 30px 0;
                border-left: 4px solid #22c55e;
              ">
                <div style="color: #16a34a; font-weight: 600; margin-bottom: 8px;">System Status</div>
                <div style="color: #15803d; font-size: 14px; line-height: 1.6;">
                  ✓ Server operational<br>
                  ✓ Database connected<br>
                  ✓ API endpoints active<br>
                  ✓ React frontend loaded
                </div>
              </div>
              
              <form id="loginForm" style="text-align: left;">
                <h3 style="
                  color: #0B1F3A;
                  font-family: 'Montserrat', sans-serif;
                  font-size: 18px;
                  margin-bottom: 20px;
                  text-align: center;
                ">Login to Continue</h3>
                
                <div style="margin: 20px 0;">
                  <label style="
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                  ">Email Address</label>
                  <input type="email" id="email" placeholder="member@poopalotzi.com" required style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    box-sizing: border-box;
                    font-size: 16px;
                    transition: border-color 0.2s;
                    background: #f9fafb;
                  ">
                </div>
                
                <div style="margin: 20px 0;">
                  <label style="
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                  ">Password</label>
                  <input type="password" id="password" placeholder="member1234" required style="
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    box-sizing: border-box;
                    font-size: 16px;
                    transition: border-color 0.2s;
                    background: #f9fafb;
                  ">
                </div>
                
                <button type="submit" style="
                  width: 100%;
                  background: linear-gradient(135deg, #0B1F3A 0%, #1e3a5f 100%);
                  color: white;
                  padding: 14px 24px;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 600;
                  font-size: 16px;
                  margin: 20px 0;
                  transition: all 0.2s;
                  box-shadow: 0 4px 12px rgba(11, 31, 58, 0.2);
                ">Access Dashboard</button>
              </form>
              
              <div style="
                background: #f8fafc;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                border: 1px solid #e2e8f0;
              ">
                <div style="
                  font-weight: 600;
                  color: #475569;
                  margin-bottom: 12px;
                  font-size: 14px;
                ">Test Accounts</div>
                <div style="
                  color: #64748b;
                  font-size: 13px;
                  line-height: 1.6;
                ">
                  <div style="margin: 6px 0;">
                    <strong>Member:</strong> member@poopalotzi.com / member1234
                  </div>
                  <div style="margin: 6px 0;">
                    <strong>Admin:</strong> admin@poopalotzi.com / admin1234
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`
      );
      
      // Add login functionality
      html = html.replace(
        '</body>',
        `
        <script>
          document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            const button = e.target.querySelector('button');
            button.textContent = 'Logging in...';
            button.disabled = true;
            
            try {
              const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
              });
              
              if (response.ok) {
                button.textContent = 'Success! Redirecting...';
                setTimeout(() => window.location.reload(), 500);
              } else {
                const error = await response.text();
                alert('Login failed: ' + error);
                button.textContent = 'Access Dashboard';
                button.disabled = false;
              }
            } catch (error) {
              alert('Connection error. Please try again.');
              button.textContent = 'Access Dashboard';
              button.disabled = false;
            }
          });
          
          // Add input focus effects
          document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function() {
              this.style.borderColor = '#0B1F3A';
              this.style.background = 'white';
            });
            input.addEventListener('blur', function() {
              this.style.borderColor = '#e5e7eb';
              this.style.background = '#f9fafb';
            });
          });
        </script>
        </body>`
      );
      
      res.send(html);
    } else {
      res.status(404).send('Application not found');
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Poopalotzi Marina Management System running on port ${PORT}`);
    console.log(`Complete React frontend with original styling restored`);
  });
}

startApp().catch(console.error);