// src/utils/triggerRateLimiter.ts
import logger from "../config/logger";

/**
 * Content types for different API request categories
 */
export enum ContentType {
  IMAGE = "image",
  VIDEO = "video",
  TEXT = "text",
  PROJECT = "project",
  PORTFOLIO = "portfolio",
  CREATOR = "creator",
}

/**
 * Utility class to enforce rate limits across distributed trigger tasks
 */
export class TriggerRateLimiter {
  // Singleton instance
  private static instance: TriggerRateLimiter;

  // Track the last request timestamps for each content type
  private requestTimestamps: Record<ContentType, number[]> = {
    [ContentType.IMAGE]: [],
    [ContentType.VIDEO]: [],
    [ContentType.TEXT]: [],
    [ContentType.PROJECT]: [],
    [ContentType.PORTFOLIO]: [],
    [ContentType.CREATOR]: [],
  };

  // Rate limits configuration (requests per minute)
  private rateLimits: Record<ContentType, number> = {
    [ContentType.IMAGE]: 15,
    [ContentType.VIDEO]: 15,
    [ContentType.TEXT]: 15,
    [ContentType.PROJECT]: 15,
    [ContentType.PORTFOLIO]: 15,
    [ContentType.CREATOR]: 15,
  };

  // Maximum concurrent tasks
  private maxConcurrentTasks: Record<ContentType, number> = {
    [ContentType.IMAGE]: 5,
    [ContentType.VIDEO]: 3,
    [ContentType.TEXT]: 5,
    [ContentType.PROJECT]: 3,
    [ContentType.PORTFOLIO]: 2,
    [ContentType.CREATOR]: 5,
  };

  // Currently running concurrent tasks
  private activeTasks: Record<ContentType, number> = {
    [ContentType.IMAGE]: 0,
    [ContentType.VIDEO]: 0,
    [ContentType.TEXT]: 0,
    [ContentType.PROJECT]: 0,
    [ContentType.PORTFOLIO]: 0,
    [ContentType.CREATOR]: 0,
  };

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): TriggerRateLimiter {
    if (!TriggerRateLimiter.instance) {
      TriggerRateLimiter.instance = new TriggerRateLimiter();
    }
    return TriggerRateLimiter.instance;
  }

  /**
   * Update rate limits configuration if needed
   */
  public setRateLimits(limits: Partial<Record<ContentType, number>>): void {
    for (const [type, limit] of Object.entries(limits)) {
      if (this.rateLimits.hasOwnProperty(type)) {
        this.rateLimits[type as ContentType] = limit!;
      }
    }
  }

  /**
   * Update concurrency limits configuration if needed
   */
  public setConcurrencyLimits(
    limits: Partial<Record<ContentType, number>>
  ): void {
    for (const [type, limit] of Object.entries(limits)) {
      if (this.maxConcurrentTasks.hasOwnProperty(type)) {
        this.maxConcurrentTasks[type as ContentType] = limit!;
      }
    }
  }

  /**
   * Check if starting a new task would exceed rate or concurrency limits
   */
  public canStartTask(contentType: ContentType): boolean {
    // Check concurrency limit
    if (this.activeTasks[contentType] >= this.maxConcurrentTasks[contentType]) {
      return false;
    }

    // Clean up old timestamps (older than 1 minute)
    const oneMinuteAgo = Date.now() - 60000;
    this.requestTimestamps[contentType] = this.requestTimestamps[
      contentType
    ].filter((timestamp) => timestamp > oneMinuteAgo);

    // Check rate limit
    return (
      this.requestTimestamps[contentType].length < this.rateLimits[contentType]
    );
  }

  /**
   * Mark a task as started for a content type
   */
  public startTask(contentType: ContentType): void {
    this.requestTimestamps[contentType].push(Date.now());
    this.activeTasks[contentType]++;

    const activeCount = this.activeTasks[contentType];
    const requestCount = this.requestTimestamps[contentType].length;
    logger.debug(
      `Rate limit: Started ${contentType} task (active: ${activeCount}/${this.maxConcurrentTasks[contentType]}, rate: ${requestCount}/${this.rateLimits[contentType]}/min)`
    );
  }

  /**
   * Mark a task as completed for a content type
   */
  public completeTask(contentType: ContentType): void {
    if (this.activeTasks[contentType] > 0) {
      this.activeTasks[contentType]--;
    }
    logger.debug(
      `Rate limit: Completed ${contentType} task (active: ${this.activeTasks[contentType]})`
    );
  }

  /**
   * Wait until a task can be started (within rate and concurrency limits)
   * @param contentType The type of content being processed
   * @param maxWaitMs Maximum wait time in milliseconds before giving up
   * @returns Promise that resolves when task can proceed or rejects if max wait time exceeded
   */
  public async waitForSlot(
    contentType: ContentType,
    maxWaitMs = 300000
  ): Promise<void> {
    const startTime = Date.now();
    const checkInterval = 1000; // 1 second

    while (Date.now() - startTime < maxWaitMs) {
      if (this.canStartTask(contentType)) {
        this.startTask(contentType);
        return;
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(
      `Rate limit: Maximum wait time exceeded for ${contentType} task`
    );
  }

  /**
   * Process a batch of items with rate limiting
   * @param items Array of items to process
   * @param contentType The type of content being processed
   * @param processFn Function to process each item
   * @param concurrencyLimit Optional override for concurrency limit
   * @param maxConcurrent Maximum number of promises to process concurrently
   * @returns Promise that resolves when all items are processed
   */
  public async processBatch<T, R>(
    items: T[],
    contentType: ContentType,
    processFn: (item: T) => Promise<R>,
    concurrencyLimit?: number,
    maxConcurrent?: number
  ): Promise<R[]> {
    const originalLimit = this.maxConcurrentTasks[contentType];

    if (concurrencyLimit) {
      this.maxConcurrentTasks[contentType] = concurrencyLimit;
    }

    try {
      return await this._processBatch(
        items,
        contentType,
        processFn,
        maxConcurrent
      );
    } finally {
      // Restore original limit
      this.maxConcurrentTasks[contentType] = originalLimit;
    }
  }

  /**
   * Internal method to process a batch of items with rate limiting
   */
  private async _processBatch<T, R>(
    items: T[],
    contentType: ContentType,
    processFn: (item: T) => Promise<R>,
    maxConcurrent: number = 0
  ): Promise<R[]> {
    const results: R[] = [];

    // If maxConcurrent is specified and valid, process in chunks
    if (maxConcurrent > 0) {
      // Process in chunks with maximum concurrency
      for (let i = 0; i < items.length; i += maxConcurrent) {
        const chunk = items.slice(i, i + maxConcurrent);
        const chunkPromises = chunk.map(async (item) => {
          try {
            await this.waitForSlot(contentType);
            const result = await processFn(item);
            results.push(result);
            return result;
          } catch (error) {
            logger.error(`Error processing ${contentType} item:`, error);
            throw error;
          } finally {
            this.completeTask(contentType);
          }
        });

        await Promise.all(chunkPromises);
      }
    } else {
      // Process all items with rate limiting but without chunking
      const promises = items.map(async (item) => {
        try {
          await this.waitForSlot(contentType);
          const result = await processFn(item);
          results.push(result);
          return result;
        } catch (error) {
          logger.error(`Error processing ${contentType} item:`, error);
          throw error;
        } finally {
          this.completeTask(contentType);
        }
      });

      await Promise.all(promises);
    }

    return results;
  }
}

// Export a singleton instance
export const triggerRateLimiter = TriggerRateLimiter.getInstance();
