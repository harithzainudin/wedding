/**
 * Simple session-level cache with request deduplication
 * - Caches API responses in memory until page refresh
 * - Deduplicates simultaneous requests to the same endpoint
 * - Supports forced refresh for admin actions
 */

const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Fetches data with caching and request deduplication
 * @param key - Unique cache key for this request
 * @param fetcher - Function that performs the actual API call
 * @param forceRefresh - If true, bypasses cache and fetches fresh data
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  forceRefresh = false
): Promise<T> {
  // Return cached value if available and not forcing refresh
  if (!forceRefresh && cache.has(key)) {
    return cache.get(key) as T;
  }

  // Return in-flight request if one exists (deduplication)
  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  // Create new request
  const promise = fetcher()
    .then((result) => {
      cache.set(key, result);
      inFlight.delete(key);
      return result;
    })
    .catch((error: unknown) => {
      inFlight.delete(key);
      throw error;
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Clears the cache
 * @param key - Optional specific key to clear. If not provided, clears entire cache.
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Cache keys for consistency
export const CACHE_KEYS = {
  VENUE: "venue",
  WEDDING_DETAILS: "wedding-details",
  SCHEDULE: "schedule",
  CONTACTS: "contacts",
  MUSIC: "music",
  GALLERY_IMAGES: "gallery-images",
  RSVPS: "rsvps",
} as const;
