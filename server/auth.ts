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
  console.log("🔧 === STARTING AUTH SETUP ===");
  // Express middleware already set up in index.ts
  
  // Environment detection for proper session configuration
  const isReplitProduction = !!(process.env.REPLIT_DOMAINS || process.env.REPL_SLUG);
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  console.log("🔧 Auth setup environment detection:", { isReplitProduction, isDevelopment });
  
  // Force localhost settings for any localhost:3000 connections regardless of environment
  // This allows testing with curl and browsers on localhost
  const forceLocalhostMode = process.env.FORCE_LOCALHOST_SESSION === 'true';
  const isLocalhost = forceLocalhostMode || (!isReplitProduction && isDevelopment);
  
  // Use HTTP for localhost testing, HTTPS for Replit external access
  const useSecure = !isLocalhost; // false for localhost, true for Replit
  const sameSitePolicy = isLocalhost ? 'lax' : 'none'; // lax for localhost, none for cross-origin
  
  console.log("🔧 SESSION ENVIRONMENT DETECTION:", {
    isReplitProduction,
    isDevelopment,
    forceLocalhostMode,
    isLocalhost,
    useSecure,
    sameSitePolicy
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "poopalotzi-secret",
    resave: false,
    saveUninitialized: false, // Keep false to avoid creating unnecessary sessions
    cookie: { 
      secure: useSecure, // false for localhost, true for Replit
      httpOnly: true, // Security - keep cookies server-only
      sameSite: sameSitePolicy as 'none' | 'lax', // lax for localhost, none for cross-origin
      maxAge: 2 * 60 * 60 * 1000, // 2 hours - better security for payment processing
      path: '/',
      domain: undefined // Let browser handle domain automatically
    },
    name: 'poopalotzi_session', // Custom session cookie name as requested
    rolling: true,
    proxy: useSecure // Trust proxy when using secure cookies
  };

  if (storage.sessionStore) {
    sessionSettings.store = storage.sessionStore;
    console.log("✅ Using database session store");
  } else {
    console.log("⚠️ No session store found - using memory store");
  }
  
  console.log("Setting up authentication with session store");
  console.log("Environment detected:", {
    isReplitProduction,
    isDevelopment,
    isLocalhost,
    useSecure,
    nodeEnv: process.env.NODE_ENV,
    replitDomains: process.env.REPLIT_DOMAINS,
    replSlug: process.env.REPL_SLUG
  });
  console.log("Session cookie settings:", {
    secure: sessionSettings.cookie?.secure,
    httpOnly: sessionSettings.cookie?.httpOnly,
    sameSite: sessionSettings.cookie?.sameSite,
    domain: sessionSettings.cookie?.domain
  });

  // Proxy trust already set in index.ts for early initialization
  console.log("🔗 Proxy trust status:", app.get("trust proxy"));
  
  // Production HTTPS session configuration as requested
  const productionSessionSettings = {
    ...sessionSettings,
    cookie: {
      ...sessionSettings.cookie,
      secure: true, // HTTPS required for production
      sameSite: 'none' as const, // Required for cross-origin HTTPS requests
      httpOnly: true // Security best practice
    }
  };
  
  console.log("🔄 USING PRODUCTION SESSION SETTINGS (secure: true, sameSite: none)");
  console.log("🔄 Final session configuration:", JSON.stringify(productionSessionSettings, null, 2));
  
  try {
    app.use(session(productionSessionSettings));
    console.log("✅ Session middleware successfully registered");
  } catch (error) {
    console.error("❌ SESSION MIDDLEWARE ERROR:", error);
    throw error;
  }
  
  // Debug middleware for external browser session issues
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
      console.log("🔍 SESSION DEBUG:", {
        sessionID: req.sessionID,
        hasCookie: !!req.headers.cookie,
        cookieValue: req.headers.cookie?.includes('poopalotzi_session') ? 'Present' : 'Missing',
        userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
        host: req.headers.host,
        origin: req.headers.origin,
        isExternal: !req.headers['user-agent']?.includes('replit')
      });
      
      // Ensure CORS headers are always set for auth endpoints
      res.header('Access-Control-Allow-Credentials', 'true');
      if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
      }
    }
    next();
  });
  
  try {
    app.use(passport.initialize());
    console.log("✅ Passport initialize middleware registered");
    
    app.use(passport.session());
    console.log("✅ Passport session middleware registered");
  } catch (error) {
    console.error("❌ PASSPORT MIDDLEWARE ERROR:", error);
    throw error;
  }

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
        
        console.log("✅ USER LOGGED IN:", user.id, user.email);
        console.log("🆔 SESSION AFTER LOGIN:", req.sessionID, !!req.user);
        console.log("📋 SESSION DATA:", JSON.stringify(req.session, null, 2));
        
        // Force session save and confirm cookie is sent for external browsers
        console.log("🍪 FORCING SESSION SAVE for external browser compatibility");
        
        console.log("🌐 REQUEST FROM:", {
          userAgent: req.headers['user-agent']?.substring(0, 100),
          origin: req.headers.origin,
          host: req.headers.host,
          isReplit: isReplitProduction,
          isExternalBrowser: !req.headers['user-agent']?.includes('replit')
        });
        
        // Force save session and add explicit cookie headers for external browsers
        console.log("🔄 About to save session...");
        console.log("🔄 Session ID before save:", req.sessionID);
        console.log("🔄 Session data before save:", JSON.stringify(req.session, null, 2));
        
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("❌ SESSION SAVE ERROR:", saveErr);
          } else {
            console.log("✅ SESSION SAVED SUCCESSFULLY");
            console.log("🔄 Session ID after save:", req.sessionID);
            console.log("🔄 Session data after save:", JSON.stringify(req.session, null, 2));
          }
          
          // Set explicit cookie headers for external browser compatibility
          console.log("🍪 SETTING EXPLICIT COOKIE HEADERS");
          res.set({
            'Access-Control-Allow-Credentials': 'true'
          });
          
          // Remove sensitive data and respond
          const { passwordHash: _, ...safeUser } = user;
          res.json(safeUser);
        });
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
    console.log("req.session:", req.session); // Print req.session as requested
    console.log("Session data:", JSON.stringify(req.session, null, 2));
    console.log("User from session:", req.user ? `ID: ${req.user.id}, Email: ${req.user.email}` : 'No user');
    console.log("isAuthenticated():", req.isAuthenticated());
    console.log("Request headers:", {
      cookie: req.headers.cookie,
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host
    });
    console.log("Cookie analysis:", {
      hasCookie: !!req.headers.cookie,
      cookieContainsSession: req.headers.cookie?.includes('poopalotzi_session'),
      cookieContainsDash: req.headers.cookie?.includes('poopalotzi-session'),
      rawCookieHeader: req.headers.cookie,
      expectedCookieName: 'poopalotzi_session',
      actualCookieNames: req.headers.cookie?.match(/[^=;,\s]+=/)?.map(s => s.slice(0, -1))
    });
    
    if (!req.isAuthenticated()) {
      console.log("❌ Authentication failed - returning 401");
      console.log("❌ Session appears to be invalid or missing user data");
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Remove sensitive data
    const { passwordHash: _, ...safeUser } = req.user as any;
    console.log("✅ Returning authenticated user:", safeUser.email);
    res.json(safeUser);
  });
}