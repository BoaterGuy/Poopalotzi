import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { promisify } from "util";
import { storage } from "./index.js";
import { User as SelectUser } from "../shared/schema.js";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  // Express middleware already set up in index.ts
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "poopalotzi-secret",
    resave: false,
    saveUninitialized: true, // Changed to true for better session persistence
    cookie: { 
      secure: false, // Must be false for development (non-HTTPS)
      httpOnly: false, // Changed to false for debugging
      sameSite: 'lax', // Changed back to 'lax' for same-origin requests
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
      // Removed domain setting to let browser handle it
    },
    name: 'poopalotzi-session', // Changed name to avoid conflicts
    rolling: true
  };

  if (storage.sessionStore) {
    sessionSettings.store = storage.sessionStore;
  }
  
  console.log("Setting up authentication with session store");
  console.log("Session settings:", {
    ...sessionSettings,
    secret: "[REDACTED]"
  });

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          console.log(`--- LOGIN ATTEMPT ---`);
          console.log(`Email: ${email}`);
          console.log(`Password provided: ${password ? 'YES' : 'NO'}`);
          
          const user = await storage.getUserByEmail(email);
          console.log(`User found in database: ${user ? 'YES' : 'NO'}`);
          
          if (user) {
            console.log(`User ID: ${user.id}`);
            console.log(`User role: ${user.role}`);
            console.log(`Password hash exists: ${user.passwordHash ? 'YES' : 'NO'}`);
          }
          
          if (!user || !user.passwordHash) {
            console.log(`Login failed: User not found or no password hash`);
            return done(null, false, { message: "Incorrect email or password" });
          }

          const isMatch = await comparePasswords(password, user.passwordHash);
          console.log(`Password comparison result: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
          
          if (!isMatch) {
            console.log(`Login failed: Password mismatch`);
            return done(null, false, { message: "Incorrect email or password" });
          }

          console.log(`Login successful for user: ${user.email}`);
          return done(null, user);
        } catch (err) {
          console.error(`Login error:`, err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    console.log("SERIALIZING USER:", user.id, user.email);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("DESERIALIZING USER ID:", id);
      const user = await storage.getUser(id);
      console.log("USER RETRIEVED FROM DB:", user ? `${user.id} - ${user.email}` : 'NOT FOUND');
      done(null, user);
    } catch (err) {
      console.error("DESERIALIZATION ERROR:", err);
      done(err);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      console.log("Registration request received:", req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        console.log("User already exists:", req.body.email);
        return res.status(400).json({ message: "Email already exists" });
      }

      const passwordHash = await hashPassword(req.body.password);
      
      // Prepare user data, converting empty serviceLevelId to null
      const userData = {
        ...req.body,
        serviceLevelId: req.body.serviceLevelId && req.body.serviceLevelId !== "" ? parseInt(req.body.serviceLevelId) : null
      };
      
      console.log("Creating user with data:", { ...userData, password: "[REDACTED]" });
      
      // Create the user
      const user = await storage.createUser(userData, passwordHash);
      console.log("User created successfully:", user.id, user.email);
      
      // If user role is member, create a boat owner record
      if (user.role === "member") {
        console.log("Creating boat owner record for user:", user.id);
        await storage.createBoatOwner({ userId: user.id });
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return next(err);
        }
        
        console.log("USER LOGGED IN AFTER REGISTRATION:", user.id, user.email);
        console.log("SESSION AFTER LOGIN:", req.sessionID, !!req.user);
        
        // Remove sensitive data
        const { passwordHash: _, ...safeUser } = user;
        console.log("Registration completed successfully for:", safeUser.email);
        res.status(201).json(safeUser);
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: err.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error during login" });
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        
        console.log("USER LOGGED IN:", user.id, user.email);
        console.log("SESSION AFTER LOGIN:", req.sessionID, !!req.user);
        console.log("SESSION DATA:", JSON.stringify(req.session, null, 2));
        
        // Remove sensitive data
        const { passwordHash: _, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/auth/me", (req, res) => {
    console.log("--- /api/auth/me REQUEST ---");
    console.log("Session ID:", req.sessionID);
    console.log("Session data:", JSON.stringify(req.session, null, 2));
    console.log("User from session:", req.user ? `ID: ${req.user.id}, Email: ${req.user.email}` : 'No user');
    console.log("isAuthenticated():", req.isAuthenticated());
    console.log("Request headers:", {
      cookie: req.headers.cookie,
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    });
    
    if (!req.isAuthenticated()) {
      console.log("Authentication failed - returning 401");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Remove sensitive data
    const { passwordHash: _, ...safeUser } = req.user as any;
    console.log("Returning authenticated user:", safeUser.email);
    res.json(safeUser);
  });
}