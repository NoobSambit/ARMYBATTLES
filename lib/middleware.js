import User from '../models/User';
import { getSessionTokenFromRequest } from '../utils/auth';

const rateLimitStore = new Map();

export function withRateLimit(limit = 10, windowMs = 60000) {
  return async (req, res, next) => {
    const identifier = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const key = `${identifier}:${req.url}`;
    
    const now = Date.now();
    const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }
    
    record.count++;
    rateLimitStore.set(key, record);
    
    if (record.count > limit) {
      return res.status(429).json({ 
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }
    
    next();
  };
}

export function withValidation(schema) {
  return async (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error.errors) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Invalid request data' });
    }
  };
}

export function withAuth(options = {}) {
  return async (req, res, next) => {
    try {
      const token = req.sessionToken || getSessionTokenFromRequest(req);

      req.sessionToken = token;

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized - No session token provided' });
      }

      const user = await User.findOne({ sessionToken: token });
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized - User not found' });
      }

      if (user.sessionExpiresAt && user.sessionExpiresAt < new Date()) {
        return res.status(401).json({ error: 'Unauthorized - Session expired' });
      }
      
      if (options.requireAdmin && !user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
      }
      
      req.userId = user._id.toString();
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  };
}

export function withCors(req, res, next) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}

export function createHandler(handler, middlewares = []) {
  return async (req, res) => {
    const runMiddleware = (middleware) => {
      return new Promise((resolve, reject) => {
        middleware(req, res, (result) => {
          if (result instanceof Error) {
            return reject(result);
          }
          return resolve(result);
        });
      });
    };

    try {
      for (const middleware of middlewares) {
        if (res.headersSent) {
          return;
        }
        await runMiddleware(middleware);
      }
      
      if (!res.headersSent) {
        await handler(req, res);
      }
    } catch (error) {
      if (!res.headersSent) {
        console.error('Handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

export function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}
