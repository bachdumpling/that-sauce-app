// src/lib/cache.ts
import NodeCache from "node-cache";
import logger from "../config/logger";

/**
 * Simple in-memory cache implementation for API responses
 */
export const cache = new NodeCache({
  stdTTL: 300, // Default TTL: 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Use references instead of deep copies for better performance
});

/**
 * Cache middleware for Express routes
 * @param ttl Time to live in seconds
 * @param keyFn Function to generate cache key from request
 */
export const cacheMiddleware = (ttl = 300, keyFn?: (req: any) => string) => {
  return (req: any, res: any, next: any) => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Generate cache key
    const key = keyFn ? keyFn(req) : `${req.originalUrl || req.url}`;

    // Check if we have a cached response
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      logger.debug(`Cache hit for key: ${key}`);
      return res.json({
        ...cachedResponse,
        cached: true,
      });
    }

    // Store the original res.json method
    const originalJson = res.json;

    // Override res.json to cache the response
    res.json = function (body: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttl);
        logger.debug(`Cached response for key: ${key}`);
      }

      // Call the original method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Invalidate cache entries based on a pattern
 * @param pattern String pattern to match cache keys
 */
export const invalidateCache = (pattern: string) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter((key: string) => key.includes(pattern));

  if (matchingKeys.length > 0) {
    matchingKeys.forEach((key: string) => cache.del(key));
    logger.debug(
      `Invalidated ${matchingKeys.length} cache entries matching pattern: ${pattern}`
    );
  }
};

export default cache;
