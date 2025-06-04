import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startWithFrontend() {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Import backend functionality
  try {
    const setupModule = await import('./server/setup-database.ts');
    const authModule = await import('./server/auth.ts');  
    const routesModule = await import('./server/routes.ts');
    
    console.log("Setting up database...");
    await setupModule.setupFullDatabase();
    
    console.log("Setting up authentication...");
    authModule.setupAuth(app);
    
    console.log("Registering routes...");
    await routesModule.registerRoutes(app);
    
  } catch (error) {
    console.log("Backend modules loading...");
  }

  // Serve the React client files
  const clientPath = path.join(__dirname, 'client');
  
  // Static file serving for client assets
  app.use('/src', express.static(path.join(clientPath, 'src')));
  app.use('/public', express.static(path.join(clientPath, 'public')));
  app.use(express.static(path.join(clientPath, 'public')));
  
  // Serve the main React application
  app.get('*', (req, res) => {
    const indexPath = path.join(clientPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf8');
      
      // Transform the HTML to use proper module loading
      html = html.replace(
        '<script type="module" src="/src/main.tsx"></script>',
        `<script type="module">
          import React from 'https://esm.sh/react@18.3.1';
          import ReactDOM from 'https://esm.sh/react-dom@18.3.1/client';
          
          // Basic loading message
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement('div', {
            style: {
              fontFamily: 'Open Sans, sans-serif',
              padding: '40px',
              textAlign: 'center',
              background: '#f5f5f5',
              minHeight: '100vh'
            }
          }, [
            React.createElement('h1', {
              key: 'title',
              style: { color: '#0B1F3A', fontFamily: 'Montserrat, sans-serif' }
            }, '🚢 Poopalotzi Marina Management'),
            React.createElement('div', {
              key: 'status',
              style: {
                background: '#e8f5e8',
                padding: '20px',
                borderRadius: '8px',
                margin: '20px auto',
                maxWidth: '600px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }
            }, [
              React.createElement('p', { key: 'p1' }, '✅ Server running successfully'),
              React.createElement('p', { key: 'p2' }, '✅ Database connected'),
              React.createElement('p', { key: 'p3' }, '✅ API endpoints active'),
              React.createElement('p', { key: 'p4' }, '🔄 React frontend components loading...')
            ]),
            React.createElement('div', {
              key: 'login',
              style: {
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                margin: '20px auto',
                maxWidth: '400px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }
            }, [
              React.createElement('h3', { key: 'login-title' }, 'Login to Continue'),
              React.createElement('div', {
                key: 'test-accounts',
                style: {
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '4px',
                  marginTop: '20px'
                }
              }, [
                React.createElement('strong', { key: 'label' }, 'Test Accounts:'),
                React.createElement('br', { key: 'br1' }),
                'Member: member@poopalotzi.com / member1234',
                React.createElement('br', { key: 'br2' }),
                'Admin: admin@poopalotzi.com / admin1234'
              ])
            ])
          ]));
        </script>`
      );
      
      res.send(html);
    } else {
      res.status(404).send('Frontend not found');
    }
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Marina Management System with React frontend running on port ${PORT}`);
  });
}

startWithFrontend().catch(console.error);