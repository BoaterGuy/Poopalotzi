import express, { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './index';
import { comparePasswords, hashPassword } from './auth';
import { z } from 'zod';

const router = Router();

// Set up passport local strategy for authentication
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      // Get the user from the database
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user || !user.passwordHash) {
        console.log(`Login failed: User not found for email ${email}`);
        return done(null, false, { message: 'Incorrect email or password' });
      }

      // Verify the password
      const isMatch = await comparePasswords(password, user.passwordHash);
      if (!isMatch) {
        console.log(`Login failed: Password mismatch for user ${email}`);
        return done(null, false, { message: 'Incorrect email or password' });
      }

      // Login successful
      console.log(`Login successful for user ${email}`);
      return done(null, user);
    } catch (error) {
      console.error('Error during authentication:', error);
      return done(error);
    }
  }
));

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || undefined);
  } catch (error) {
    done(error);
  }
});

// Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    
    if (!user) {
      console.log('Authentication failed:', info?.message);
      return res.status(401).json({ message: info?.message || 'Authentication failed' });
    }
    
    // Log in the user
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Login error:', loginErr);
        return next(loginErr);
      }
      
      // Return user data (omit sensitive information)
      const { passwordHash, ...safeUser } = user;
      console.log('User logged in successfully:', safeUser.email);
      return res.json(safeUser);
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error during logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Current user route
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const { passwordHash, ...safeUser } = req.user as any;
  return res.json(safeUser);
});

// Register/signup route
router.post('/register', async (req, res, next) => {
  try {
    // Validation schema for registration
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
    });
    
    // Validate input
    const userData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const passwordHash = await hashPassword(userData.password);
    
    // Create user
    const newUser = await storage.createUser({
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'member',
    }, passwordHash);
    
    // Automatically log in the new user
    req.login(newUser, (err) => {
      if (err) {
        return next(err);
      }
      
      // Return user data (omit sensitive information)
      const { passwordHash, ...safeUser } = newUser;
      return res.status(201).json(safeUser);
    });
  } catch (error) {
    next(error);
  }
});

export default router;