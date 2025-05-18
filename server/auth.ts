import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { promisify } from "util";
import { storage } from "./index";
import { User as SelectUser } from "@shared/schema";

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
  // Generate a dynamic secret if none is provided
  const sessionSecret = process.env.SESSION_SECRET || "poopalotzi-secret-" + Date.now();
  
  console.log("Auth environment:", {
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === "production"
  });
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: { 
      // In production, we'll need to handle this differently depending on the hosting environment
      secure: false, // Setting to false regardless of environment to ensure login works
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          const isMatch = await comparePasswords(password, user.passwordHash);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect email or password" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      const passwordHash = await hashPassword(req.body.password);
      
      // Create the user
      const user = await storage.createUser(req.body, passwordHash);
      
      // If user role is member, create a boat owner record
      if (user.role === "member") {
        await storage.createBoatOwner({ userId: user.id });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove sensitive data
        const { passwordHash: _, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
      passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Remove sensitive data
    const { passwordHash: _, ...safeUser } = req.user as any;
    res.json(safeUser);
  });
}