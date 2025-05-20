import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import cors from 'cors';

// Setup ES Modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory data storage
const users = new Map();
const serviceLevels = new Map();
const marinas = new Map();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Initialize sample data
async function initData() {
  console.log("Setting up demo data...");
  
  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  users.set(1, {
    id: 1,
    email: 'admin@poopalotzi.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    passwordHash,
    createdAt: new Date()
  });
  
  // Service levels
  serviceLevels.set(1, {
    id: 1,
    name: "Basic Pump-Out",
    description: "One-time pump-out service",
    price: 4995,
    type: "one-time",
    serviceLevel: "single-head",
    isActive: true
  });
  
  serviceLevels.set(2, {
    id: 2,
    name: "Monthly Plan",
    description: "4 pump-outs per month",
    price: 14995,
    type: "monthly",
    serviceLevel: "single-head",
    isActive: true
  });
  
  serviceLevels.set(3, {
    id: 3,
    name: "Seasonal Pass",
    description: "Unlimited service April-October",
    price: 69995,
    type: "seasonal",
    serviceLevel: "multi-head",
    isActive: true
  });
  
  // Marinas
  marinas.set(1, {
    id: 1,
    name: "Harbor Bay Marina",
    address: "123 Harbor Way, Bay Harbor, MI 49770",
    phone: "231-555-1234",
    isActive: true
  });
  
  marinas.set(2, {
    id: 2,
    name: "Sunset Point Marina",
    address: "789 Sunset Drive, Traverse City, MI 49684",
    phone: "231-555-6789",
    isActive: true
  });
  
  console.log("Demo data initialized successfully");
}

// API routes
app.get('/api/service-levels', (req, res) => {
  res.json(Array.from(serviceLevels.values()));
});

app.get('/api/marinas', (req, res) => {
  res.json(Array.from(marinas.values()));
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = Array.from(users.values()).find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const userInfo = { ...user };
  delete userInfo.passwordHash;
  
  res.json(userInfo);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main HTML page
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Poopalotzi - Marina Pump-Out Services</title>
      <meta name="description" content="Professional marina pump-out services for boat owners">
      <style>
        body {
          font-family: system-ui, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 20px;
          background-color: #f9f9f9;
        }
        header {
          text-align: center;
          padding: 2rem 0;
        }
        h1 { color: #0e7490; }
        h2 { 
          color: #0e7490;
          border-bottom: 2px solid #0e7490;
          padding-bottom: 0.5rem;
        }
        .logo {
          max-width: 250px;
          border-radius: 10px;
        }
        .hero {
          background-color: #e0f2fe;
          padding: 2rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          text-align: center;
        }
        .services {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .service {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
          transition: transform 0.2s;
        }
        .service:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        .price {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0e7490;
          display: block;
          margin-top: 1rem;
        }
        .button {
          display: inline-block;
          background: #0e7490;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          transition: background 0.2s;
        }
        .button:hover {
          background: #0c5d73;
        }
        .marinas {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .marina {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 1.5rem;
        }
        footer {
          text-align: center;
          margin-top: 3rem;
          padding: 2rem 0;
          border-top: 1px solid #ddd;
        }
        @media (max-width: 768px) {
          .services, .marinas {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <header>
        <img src="https://replit.s3.amazonaws.com/images/1747313657068_poopalotzi.jpg" alt="Poopalotzi Logo" class="logo">
        <h1>Poopalotzi</h1>
        <p>Professional Marina Pump-Out Services</p>
      </header>
      
      <div class="hero">
        <h2>Let us take care of your business!</h2>
        <p>Poopalotzi provides professional pump-out services for marinas and boat owners throughout the Great Lakes region.</p>
      </div>
      
      <section>
        <h2>Our Services</h2>
        <div class="services">
          <div class="service">
            <h3>Basic Pump-Out</h3>
            <p>One-time pump-out service for your boat's holding tank.</p>
            <span class="price">$49.95</span>
          </div>
          
          <div class="service">
            <h3>Monthly Plan</h3>
            <p>4 pump-outs per month, perfect for regular boaters.</p>
            <span class="price">$149.95</span>
          </div>
          
          <div class="service">
            <h3>Seasonal Pass</h3>
            <p>Unlimited service April-October, best value for frequent boaters.</p>
            <span class="price">$699.95</span>
          </div>
        </div>
      </section>
      
      <section>
        <h2>Partner Marinas</h2>
        <div class="marinas">
          <div class="marina">
            <h3>Harbor Bay Marina</h3>
            <p>123 Harbor Way<br>Bay Harbor, MI 49770</p>
            <p>231-555-1234</p>
          </div>
          
          <div class="marina">
            <h3>Sunset Point Marina</h3>
            <p>789 Sunset Drive<br>Traverse City, MI 49684</p>
            <p>231-555-6789</p>
          </div>
        </div>
      </section>
      
      <section>
        <h2>Contact Us</h2>
        <p>Have questions about our pump-out services? Ready to schedule your first appointment?</p>
        <p>Call us at: <strong>(231) 555-1234</strong></p>
        <p>Email: <strong>info@poopalotzi.com</strong></p>
        <a href="mailto:info@poopalotzi.com" class="button">Contact Us</a>
      </section>
      
      <footer>
        <p>&copy; 2025 Poopalotzi Marine Services. All rights reserved.</p>
        <p><small>Admin login: admin@poopalotzi.com / admin123</small></p>
      </footer>
    </body>
    </html>
  `);
});

// Start the server
async function startServer() {
  try {
    await initData();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Poopalotzi server running on port ${PORT}`);
      console.log('Demo account: admin@poopalotzi.com / admin123');
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();