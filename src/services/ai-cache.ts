import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { createHash } from 'crypto';

interface AICacheEntry {
  id: string;
  promptHash: string;
  promptPreview: string;
  response: any;
  model: string;
  cost: number;
  createdAt: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

interface AICacheDB extends DBSchema {
  cache: {
    key: string;
    value: AICacheEntry;
    indexes: { 'by-hash': string; 'by-date': number };
  };
  stats: {
    key: string;
    value: {
      totalHits: number;
      totalMisses: number;
      totalSaved: number;
      lastReset: number;
    };
  };
}

const DB_NAME = 'genesis-ai-cache';
const DB_VERSION = 1;
const DEFAULT_TTL = 1000 * 60 * 60 * 24; // 24 hours

class AICacheService {
  private db: IDBPDatabase<AICacheDB> | null = null;
  private memoryCache: Map<string, AICacheEntry> = new Map();
  private maxMemoryItems = 50;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<AICacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'id' });
        cacheStore.createIndex('by-hash', 'promptHash', { unique: false });
        cacheStore.createIndex('by-date', 'createdAt', { unique: false });

        db.createObjectStore('stats', { keyPath: 'key' });
      },
    });

    // Initialize stats if not exists
    const stats = await this.db.get('stats', 'global');
    if (!stats) {
      await this.db.put('stats', {
        key: 'global',
        totalHits: 0,
        totalMisses: 0,
        totalSaved: 0,
        lastReset: Date.now(),
      });
    }
  }

  private generateHash(prompt: string, context: Record<string, any> = {}): string {
    const data = JSON.stringify({ prompt, context });
    // Simple hash for browser
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `cache_${Math.abs(hash).toString(36)}`;
  }

  async get(prompt: string, context: Record<string, any> = {}): Promise<any | null> {
    await this.init();
    if (!this.db) return null;

    const promptHash = this.generateHash(prompt, context);

    // Check memory cache first
    const memEntry = this.memoryCache.get(promptHash);
    if (memEntry && Date.now() < memEntry.createdAt + memEntry.ttl) {
      memEntry.hitCount++;
      memEntry.lastAccessed = Date.now();
      await this.incrementStats('hit', memEntry.cost);
      return memEntry.response;
    }

    // Check IndexedDB
    const index = this.db.transaction('cache').store.index('by-hash');
    const entries = await index.getAll(promptHash);

    for (const entry of entries) {
      if (Date.now() < entry.createdAt + entry.ttl) {
        // Found valid entry
        entry.hitCount++;
        entry.lastAccessed = Date.now();

        // Move to memory cache
        this.addToMemoryCache(entry);

        // Update in DB
        await this.db.put('cache', entry);
        await this.incrementStats('hit', entry.cost);

        return entry.response;
      } else {
        // Expired, delete it
        await this.db.delete('cache', entry.id);
      }
    }

    await this.incrementStats('miss', 0);
    return null;
  }

  async set(
    prompt: string,
    response: any,
    model: string,
    cost: number,
    context: Record<string, any> = {},
    ttl: number = DEFAULT_TTL
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    const promptHash = this.generateHash(prompt, context);
    const id = `${promptHash}_${Date.now()}`;

    const entry: AICacheEntry = {
      id,
      promptHash,
      promptPreview: prompt.slice(0, 100),
      response,
      model,
      cost,
      createdAt: Date.now(),
      ttl,
      hitCount: 0,
      lastAccessed: Date.now(),
    };

    await this.db.put('cache', entry);
    this.addToMemoryCache(entry);

    // Cleanup old entries if needed
    await this.cleanup();
  }

  private addToMemoryCache(entry: AICacheEntry): void {
    // Evict oldest if at capacity
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const oldest = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0];
      if (oldest) {
        this.memoryCache.delete(oldest[0]);
      }
    }

    this.memoryCache.set(entry.promptHash, entry);
  }

  private async incrementStats(type: 'hit' | 'miss', savedCost: number): Promise<void> {
    if (!this.db) return;

    const stats = await this.db.get('stats', 'global');
    if (!stats) return;

    if (type === 'hit') {
      stats.totalHits++;
      stats.totalSaved += savedCost;
    } else {
      stats.totalMisses++;
    }

    await this.db.put('stats', stats);
  }

  async getStats(): Promise<{ hits: number; misses: number; saved: number; hitRate: number }> {
    await this.init();
    if (!this.db) return { hits: 0, misses: 0, saved: 0, hitRate: 0 };

    const stats = await this.db.get('stats', 'global');
    if (!stats) return { hits: 0, misses: 0, saved: 0, hitRate: 0 };

    const total = stats.totalHits + stats.totalMisses;
    const hitRate = total > 0 ? (stats.totalHits / total) * 100 : 0;

    return {
      hits: stats.totalHits,
      misses: stats.totalMisses,
      saved: stats.totalSaved,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  async invalidate(projectId: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const allEntries = await this.db.getAll('cache');
    const toDelete = allEntries.filter((entry) =>
      entry.promptPreview.includes(projectId)
    );

    for (const entry of toDelete) {
      await this.db.delete('cache', entry.id);
      this.memoryCache.delete(entry.promptHash);
    }
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.clear('cache');
    this.memoryCache.clear();

    const stats = await this.db.get('stats', 'global');
    if (stats) {
      stats.totalHits = 0;
      stats.totalMisses = 0;
      stats.totalSaved = 0;
      stats.lastReset = Date.now();
      await this.db.put('stats', stats);
    }
  }

  private async cleanup(): Promise<void> {
    if (!this.db) return;

    const allEntries = await this.db.getAll('cache');
    const now = Date.now();
    const maxEntries = 1000;

    // Remove expired entries
    const expired = allEntries.filter((e) => now > e.createdAt + e.ttl);
    for (const entry of expired) {
      await this.db.delete('cache', entry.id);
      this.memoryCache.delete(entry.promptHash);
    }

    // If still too many, remove oldest
    if (allEntries.length - expired.length > maxEntries) {
      const validEntries = allEntries.filter((e) => now <= e.createdAt + e.ttl);
      validEntries.sort((a, b) => a.lastAccessed - b.lastAccessed);

      const toRemove = validEntries.slice(0, validEntries.length - maxEntries);
      for (const entry of toRemove) {
        await this.db.delete('cache', entry.id);
        this.memoryCache.delete(entry.promptHash);
      }
    }
  }
}

// Singleton instance
export const aiCache = new AICacheService();

// Hook for React integration
export function useAICache() {
  return {
    get: aiCache.get.bind(aiCache),
    set: aiCache.set.bind(aiCache),
    invalidate: aiCache.invalidate.bind(aiCache),
    clear: aiCache.clear.bind(aiCache),
    getStats: aiCache.getStats.bind(aiCache),
  };
}
