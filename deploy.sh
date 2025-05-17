#!/bin/bash
echo "Building for production deployment..."

# First, make sure the dist directory exists
mkdir -p dist

# Create the server file directly without using esbuild
cat > dist/index.js << 'EOF'
// Production server file for Poopalotzi
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const memoryStore = require('memorystore')(session);

// In-memory storage for demo deployment
const users = new Map();
const serviceLevels = new Map();
const marinas = new Map();

// Initialize with some demo data
function initDemoData() {
  // Admin user for testing
  users.set(1, {
    id: 1,
    email: 'admin@poopalotzi.com',
    username: 'admin@poopalotzi.com',
    passwordHash: '$2a$10$0c8ZbG6InbToBZXMu/LN5.YqGcGqWsE1VECxMVYsHX9MpK7HMiDK2', // admin123
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Add some service levels
  serviceLevels.set(1, {
    id: 1,
    name: 'Basic Pump-Out',
    description: 'One-time pump-out service',
    priceInCents: 3500,
    serviceType: 'one-time',
    serviceLevel: 'single-head',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  serviceLevels.set(2, {
    id: 2,
    name: 'Premium Weekly',
    description: 'Weekly scheduled pump-out service',
    priceInCents: 12000,
    serviceType: 'monthly',
    serviceLevel: 'multi-head',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  serviceLevels.set(3, {
    id: 3,
    name: 'Seasonal Pass',
    description: 'Unlimited pump-outs for the season',
    priceInCents: 75000,
    serviceType: 'seasonal',
    serviceLevel: 'multi-head',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

// Create app
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  store: new memoryStore({
    checkPeriod: 86400000 // 24 hours
  })
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = users.get(Number(id));
  done(null, user || null);
});

// Local strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  (email, password, done) => {
    try {
      // Find user by email
      const user = Array.from(users.values()).find(u => u.email === email);
      
      if (!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }
      
      // Check password synchronously
      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden' });
};

// Auth routes
app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  const { passwordHash, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout(function() {
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/user', isAuthenticated, (req, res) => {
  const { passwordHash, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// Service levels API
app.get('/api/service-levels', (req, res) => {
  const levels = Array.from(serviceLevels.values()).filter(sl => sl.isActive);
  res.json(levels);
});

app.post('/api/service-levels', isAdmin, (req, res) => {
  const id = serviceLevels.size + 1;
  const newServiceLevel = {
    id,
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  serviceLevels.set(id, newServiceLevel);
  res.status(201).json(newServiceLevel);
});

app.put('/api/service-levels/:id', isAdmin, (req, res) => {
  const id = Number(req.params.id);
  const serviceLevel = serviceLevels.get(id);
  
  if (!serviceLevel) {
    return res.status(404).json({ message: 'Service level not found' });
  }
  
  const updatedServiceLevel = {
    ...serviceLevel,
    ...req.body,
    updatedAt: new Date()
  };
  
  serviceLevels.set(id, updatedServiceLevel);
  res.json(updatedServiceLevel);
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize the data
initDemoData();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
EOF

# Build frontend components
mkdir -p dist/public

# Create the HTML file for the frontend
cat > dist/public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Poopalotzi - Marina Pump-Out Services</title>
  <meta name="description" content="Intelligent marine pump-out service coordination for boat owners and marina operators. Get scheduled pump-out services with ease." />
  <style>
    :root {
      --primary: #0e7490;
      --primary-hover: #155e75;
      --secondary: #64748b;
      --background: #f8fafc;
      --foreground: #0f172a;
      --muted: #e2e8f0;
      --muted-foreground: #64748b;
      --accent: #f59e0b;
      --accent-hover: #d97706;
      --destructive: #ef4444;
      --destructive-hover: #dc2626;
      --border: #e2e8f0;
      --input: #e2e8f0;
      --ring: #0ea5e9;
      --radius: 0.5rem;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--background);
      color: var(--foreground);
      line-height: 1.5;
    }

    header {
      background-color: var(--primary);
      color: white;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      color: white;
      text-decoration: none;
    }

    main {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .hero {
      background-color: var(--primary);
      color: white;
      padding: 4rem 2rem;
      border-radius: var(--radius);
      margin-bottom: 2rem;
      text-align: center;
    }

    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
      opacity: 0.9;
    }

    .btn {
      display: inline-block;
      background-color: var(--accent);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius);
      text-decoration: none;
      font-weight: 500;
      transition: background-color 0.2s;
    }

    .btn:hover {
      background-color: var(--accent-hover);
    }

    .btn-primary {
      background-color: var(--primary);
    }

    .btn-primary:hover {
      background-color: var(--primary-hover);
    }

    .services {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin: 3rem 0;
    }

    .service-card {
      background-color: white;
      border-radius: var(--radius);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .service-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .service-card h3 {
      margin-bottom: 0.75rem;
      color: var(--primary);
    }

    .service-card p {
      color: var(--muted-foreground);
      margin-bottom: 1.5rem;
    }

    .price {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--foreground);
      margin-bottom: 1.5rem;
    }

    footer {
      background-color: var(--foreground);
      color: white;
      padding: 3rem 1rem;
      margin-top: 4rem;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .footer-section h4 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }

    .footer-section ul {
      list-style: none;
    }

    .footer-section ul li {
      margin-bottom: 0.5rem;
    }

    .footer-section a {
      color: var(--muted);
      text-decoration: none;
    }

    .footer-section a:hover {
      color: white;
    }

    .login-form {
      max-width: 400px;
      margin: 4rem auto;
      padding: 2rem;
      background-color: white;
      border-radius: var(--radius);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .login-form h2 {
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 1rem;
    }

    .form-actions {
      margin-top: 2rem;
    }

    .form-actions button {
      width: 100%;
      background-color: var(--primary);
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .form-actions button:hover {
      background-color: var(--primary-hover);
    }

    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }

      .hero h1 {
        font-size: 2rem;
      }

      .hero p {
        font-size: 1rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <div class="logo">Poopalotzi</div>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/services">Services</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
        <a href="/login">Login</a>
      </div>
    </nav>
  </header>

  <main id="app-container">
    <div class="hero">
      <h1>Professional Marina Pump-Out Services</h1>
      <p>We provide reliable and efficient pump-out services for boat owners. Schedule your service today!</p>
      <a href="/services" class="btn">View Services</a>
    </div>

    <h2 style="text-align: center; margin: 2rem 0;">Our Service Levels</h2>
    
    <div class="services" id="service-levels">
      <div class="service-card">
        <h3>Basic Pump-Out</h3>
        <p>One-time pump-out service for single-head boats.</p>
        <div class="price">$35.00</div>
        <a href="/login" class="btn">Book Now</a>
      </div>
      
      <div class="service-card">
        <h3>Premium Weekly</h3>
        <p>Weekly scheduled pump-out service for multi-head boats.</p>
        <div class="price">$120.00</div>
        <a href="/login" class="btn">Subscribe</a>
      </div>
      
      <div class="service-card">
        <h3>Seasonal Pass</h3>
        <p>Unlimited pump-outs for the entire season. Best value for frequent users.</p>
        <div class="price">$750.00</div>
        <a href="/login" class="btn">Get Season Pass</a>
      </div>
    </div>

    <div class="login-form" id="login-form" style="display: none;">
      <h2>Log In</h2>
      <form id="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required placeholder="Enter your email">
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required placeholder="Enter your password">
        </div>
        <div class="form-actions">
          <button type="submit">Log In</button>
        </div>
        <p style="text-align: center; margin-top: 1rem;">
          Demo login: admin@poopalotzi.com / admin123
        </p>
      </form>
    </div>
  </main>

  <footer>
    <div class="footer-content">
      <div class="footer-section">
        <h4>About Poopalotzi</h4>
        <p>We provide professional pump-out services for marinas and boat owners, ensuring clean waterways and proper waste management.</p>
      </div>
      
      <div class="footer-section">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/about">About Us</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>Contact</h4>
        <ul>
          <li>Email: info@poopalotzi.com</li>
          <li>Phone: (555) 123-4567</li>
          <li>Address: 123 Marina Way, Seaside, CA 90210</li>
        </ul>
      </div>
    </div>
    <div style="text-align: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #2d3748;">
      <p>&copy; 2025 Poopalotzi. All rights reserved.</p>
    </div>
  </footer>

  <script>
    // Simple client-side router
    function router() {
      const path = window.location.pathname;
      const appContainer = document.getElementById('app-container');
      const loginForm = document.getElementById('login-form');
      const serviceLevels = document.getElementById('service-levels');
      
      // Reset display
      loginForm.style.display = 'none';
      
      // Handle routes
      if (path === '/login') {
        appContainer.querySelector('.hero').style.display = 'none';
        serviceLevels.style.display = 'none';
        loginForm.style.display = 'block';
      } else if (path === '/services') {
        appContainer.querySelector('.hero').style.display = 'none';
        serviceLevels.style.display = 'grid';
      } else {
        appContainer.querySelector('.hero').style.display = 'block';
        serviceLevels.style.display = 'grid';
      }
    }

    // Handle form submission
    document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('Login successful!');
          window.location.href = '/';
        } else {
          alert(`Login failed: ${data.message || 'Invalid credentials'}`);
        }
      } catch (error) {
        alert('Error: Could not connect to the server');
        console.error('Login error:', error);
      }
    });

    // Run router on page load and when navigation happens
    window.addEventListener('load', router);
    window.addEventListener('popstate', router);

    // Handle navigation without page reload
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a');
      if (anchor && anchor.href.startsWith(window.location.origin)) {
        e.preventDefault();
        window.history.pushState({}, '', anchor.href);
        router();
      }
    });

    // Load service levels from API
    async function loadServiceLevels() {
      try {
        const response = await fetch('/api/service-levels');
        const serviceLevels = await response.json();
        
        if (response.ok && serviceLevels.length > 0) {
          const container = document.getElementById('service-levels');
          container.innerHTML = '';
          
          serviceLevels.forEach(service => {
            const price = (service.priceInCents / 100).toFixed(2);
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `
              <h3>${service.name}</h3>
              <p>${service.description}</p>
              <div class="price">$${price}</div>
              <a href="/login" class="btn">Book Now</a>
            `;
            container.appendChild(card);
          });
        }
      } catch (error) {
        console.error('Error loading service levels:', error);
      }
    }

    // Load service levels on page load
    window.addEventListener('load', loadServiceLevels);
  </script>
</body>
</html>
EOF

echo "Build completed successfully!"
echo "You can now deploy the application by clicking the Deploy button in Replit."