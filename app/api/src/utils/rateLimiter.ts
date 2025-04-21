// src/utils/rateLimiter.ts
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number; // tokens per ms
  private lastRefill: number;

  constructor(maxTokens: number, refillTimeMs: number) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = maxTokens / refillTimeMs;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const tokensNeeded = 1;
      const timeToWait = Math.ceil(tokensNeeded / this.refillRate);
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
