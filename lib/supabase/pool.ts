import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Connection pool configuration
const POOL_CONFIG = {
  // Maximum number of clients in the pool
  maxClients: 10,
  // Maximum time to wait for a client (ms)
  acquireTimeout: 30000,
  // Time before idle client is destroyed (ms)
  idleTimeout: 60000,
  // Connection retry configuration
  retryAttempts: 3,
  retryDelay: 1000,
}

// Client pool interface
interface PooledClient {
  client: ReturnType<typeof createClient<Database>>
  inUse: boolean
  lastUsed: number
  id: string
}

// Connection pool class
class SupabaseConnectionPool {
  private pool: PooledClient[] = []
  private waitQueue: Array<(client: PooledClient) => void> = []
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 30000) // Clean up every 30 seconds
  }

  // Get a client from the pool
  async acquire(): Promise<PooledClient> {
    // Try to find an available client
    const availableClient = this.pool.find(c => !c.inUse)
    
    if (availableClient) {
      availableClient.inUse = true
      availableClient.lastUsed = Date.now()
      return availableClient
    }

    // If pool is not full, create a new client
    if (this.pool.length < POOL_CONFIG.maxClients) {
      const newClient = this.createClient()
      this.pool.push(newClient)
      return newClient
    }

    // Wait for a client to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.indexOf(resolve)
        if (index > -1) {
          this.waitQueue.splice(index, 1)
        }
        reject(new Error('Connection pool timeout'))
      }, POOL_CONFIG.acquireTimeout)

      this.waitQueue.push((client) => {
        clearTimeout(timeout)
        resolve(client)
      })
    })
  }

  // Release a client back to the pool
  release(client: PooledClient): void {
    client.inUse = false
    client.lastUsed = Date.now()

    // If there are waiting requests, give them this client
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift()
      if (waiter) {
        client.inUse = true
        waiter(client)
      }
    }
  }

  // Create a new Supabase client
  private createClient(): PooledClient {
    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-connection-pool': 'true',
          },
        },
      }
    )

    return {
      client,
      inUse: true,
      lastUsed: Date.now(),
      id: Math.random().toString(36).substring(7),
    }
  }

  // Clean up idle connections
  private cleanup(): void {
    const now = Date.now()
    const idleClients = this.pool.filter(
      c => !c.inUse && (now - c.lastUsed) > POOL_CONFIG.idleTimeout
    )

    // Keep at least 2 clients in the pool
    const clientsToRemove = idleClients.slice(0, Math.max(0, this.pool.length - 2))
    
    for (const client of clientsToRemove) {
      const index = this.pool.indexOf(client)
      if (index > -1) {
        this.pool.splice(index, 1)
      }
    }
  }

  // Destroy the pool
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.pool = []
    this.waitQueue = []
  }

  // Get pool statistics
  getStats() {
    return {
      totalClients: this.pool.length,
      activeClients: this.pool.filter(c => c.inUse).length,
      idleClients: this.pool.filter(c => !c.inUse).length,
      waitingRequests: this.waitQueue.length,
    }
  }
}

// Singleton instance
const connectionPool = new SupabaseConnectionPool()

// Export helper functions
export async function getPooledClient() {
  return connectionPool.acquire()
}

export function releasePooledClient(client: PooledClient) {
  connectionPool.release(client)
}

export function getPoolStats() {
  return connectionPool.getStats()
}

// Query execution with automatic pooling
export async function executePooledQuery<T>(
  queryFn: (client: ReturnType<typeof createClient<Database>>) => Promise<T>
): Promise<T> {
  const pooledClient = await getPooledClient()
  
  try {
    return await queryFn(pooledClient.client)
  } finally {
    releasePooledClient(pooledClient)
  }
}

// Performance monitoring helper
export class QueryMonitor {
  static async execute<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - startTime
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      // Track metrics (can be sent to monitoring service)
      if (typeof window === 'undefined') {
        // Server-side metrics
        console.log(`Query: ${queryName}, Duration: ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`Query error: ${queryName} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
}

// Retry logic for transient failures
export async function withRetry<T>(
  fn: () => Promise<T>,
  options = {
    attempts: POOL_CONFIG.retryAttempts,
    delay: POOL_CONFIG.retryDelay,
  }
): Promise<T> {
  let lastError: any

  for (let i = 0; i < options.attempts; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on non-retryable errors
      if (error.code && ['PGRST301', 'PGRST302', '42501'].includes(error.code)) {
        throw error
      }
      
      // Wait before retrying
      if (i < options.attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, options.delay * (i + 1)))
      }
    }
  }

  throw lastError
}