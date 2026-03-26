import rateLimit, { type Options } from 'express-rate-limit';

// Development mode kontrolü - daha esnek limitler
const isDev = process.env.NODE_ENV !== 'production';

// GÜVENLİK: Proper IP detection behind proxies/CDN
function getClientIp(req: any): string {
  // Cloudflare
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp as string;
  
  // Standard proxy headers
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // İlk IP her zaman client IP'dir
    return xForwardedFor.split(',')[0].trim();
  }
  
  // DigitalOcean App Platform
  const doIp = req.headers['do-connecting-ip'];
  if (doIp) return doIp as string;
  
  // Fallback to direct IP
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

// GÜVENLİK: Rate limit key generator - IP + User Agent kombinasyonu
function generateKey(req: any): string {
  const ip = getClientIp(req);
  const ua = req.headers['user-agent'] || 'unknown';
  return `${ip}:${ua}`;
}

const createLimiter = (options: Partial<Options> & { windowMs: number; max: number; message: any }) => 
  rateLimit({
    keyGenerator: generateKey,
    skip: (req) => {
      // Health check endpoint'lerini atla
      if (req.path === '/health' || req.path === '/api/health') return true;
      // Development'ta bazı endpoint'leri atla
      if (isDev && req.path.startsWith('/api/files')) return true;
      return false;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: options.message.error || 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    ...options,
  });

/**
 * Genel API rate limiter
 * Production: 100 req/15dk | Development: 500 req/15dk
 */
export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 100,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Chat endpoint rate limiter
 * Production: 10 req/1dk | Development: 60 req/1dk
 */
export const chatLimiter = createLimiter({
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
export const agentLimiter = createLimiter({
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
export const fileLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: isDev ? 200 : 30,
  message: {
    error: 'Too many file operations, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
