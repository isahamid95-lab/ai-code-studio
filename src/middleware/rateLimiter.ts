import rateLimit from 'express-rate-limit';

// Development mode kontrolü - daha esnek limitler
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Genel API rate limiter
 * Production: 100 req/15dk | Development: 500 req/15dk
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 100,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isDev ? (req) => req.path.startsWith('/api/files') : undefined, // Development'ta file API'yi atla
});

/**
 * Chat endpoint rate limiter
 * Production: 10 req/1dk | Development: 60 req/1dk
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 60 : 10,
  message: {
    error: 'Too many chat requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Agent endpoint rate limiter
 * Production: 20 req/5dk | Development: 100 req/5dk
 */
export const agentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 100 : 20,
  message: {
    error: 'Too many agent requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Dosya işlemleri için rate limiter
 * Production: 30 req/1dk | Development: 200 req/1dk
 */
export const fileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 200 : 30,
  message: {
    error: 'Too many file operations, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
