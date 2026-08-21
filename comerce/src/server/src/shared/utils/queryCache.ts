import redisClient from "@/infra/cache/redis";
import logger from "@/infra/winston/logger";

/**
 * Generic read-through cache for expensive, filterable list/search queries
 * (e.g. product search). Keys are namespaced so an entire namespace can be
 * invalidated in one call whenever the underlying data changes (create /
 * update / delete).
 */

const DEFAULT_TTL_SECONDS = 60; // short TTL: search results can go slightly stale, never wrong for long

function buildKey(namespace: string, queryString: Record<string, any>): string {
  // Sort keys so that equivalent queries with differently-ordered params
  // (e.g. ?page=1&limit=16 vs ?limit=16&page=1) map to the same cache entry.
  const sorted = Object.keys(queryString)
    .sort()
    .reduce((acc: Record<string, any>, key) => {
      acc[key] = queryString[key];
      return acc;
    }, {});
  return `${namespace}:${JSON.stringify(sorted)}`;
}

export async function getCachedOrFetch<T>(
  namespace: string,
  queryString: Record<string, any>,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<{ data: T; cacheHit: boolean }> {
  const key = buildKey(namespace, queryString);

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return { data: JSON.parse(cached) as T, cacheHit: true };
    }
  } catch (error) {
    // Redis being unavailable should never break the request — fall through to the DB.
    logger.warn("Query cache read failed, falling back to source", {
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const data = await fetcher();

  try {
    await redisClient.set(key, JSON.stringify(data), "EX", ttlSeconds);
  } catch (error) {
    logger.warn("Query cache write failed", {
      key,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return { data, cacheHit: false };
}

/**
 * Invalidate every cached query in a namespace. Call this whenever data that
 * the namespace's queries depend on changes (e.g. a product is created,
 * updated, or deleted).
 */
export async function invalidateNamespace(namespace: string): Promise<void> {
  try {
    const keys = await redisClient.keys(`${namespace}:*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.warn("Query cache invalidation failed", {
      namespace,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
