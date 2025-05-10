import { Firestore } from 'firebase/firestore';

// Cache configuration for educational content
const CACHE_CONFIG = {
  // Cache educational content for 24 hours
  CONTENT_TTL: 24 * 60 * 60 * 1000,
  // Cache user data for 1 hour
  USER_DATA_TTL: 60 * 60 * 1000,
  // Maximum items in memory cache
  MAX_ITEMS: 1000
};

// In-memory cache for frequently accessed data
const memoryCache = new Map();

export const setupCaching = (db: Firestore) => {
  // Clear old cache entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (now > value.expiresAt) {
        memoryCache.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

// Cache educational content
export const cacheContent = (key: string, data: any, isEducationalContent = true) => {
  const ttl = isEducationalContent ? CACHE_CONFIG.CONTENT_TTL : CACHE_CONFIG.USER_DATA_TTL;
  
  // Remove oldest items if cache is full
  if (memoryCache.size >= CACHE_CONFIG.MAX_ITEMS) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }

  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttl
  });
};

// Get cached data
export const getCachedData = (key: string) => {
  const cached = memoryCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
};

// Clear user-specific cache
export const clearUserCache = (userId: string) => {
  for (const [key] of memoryCache.entries()) {
    if (key.includes(userId)) {
      memoryCache.delete(key);
    }
  }
};

// Initialize cache system
export const initializeCache = () => {
  console.log('Initializing enhanced caching system for educational platform');
  // Clear all cache on initialization
  memoryCache.clear();
};
