export class TokenBucket {
	private tokens: number;
	private lastRefill: number;

	constructor(
		private capacity: number,
		private refillPerSec: number
	) {
		this.tokens = capacity;
		this.lastRefill = Date.now();
	}

	_reset(): void {
		this.tokens = this.capacity;
		this.lastRefill = Date.now();
	}

	async take(): Promise<void> {
		this.refill();
		if (this.tokens >= 1) {
			this.tokens -= 1;
			return;
		}
		const needed = 1 - this.tokens;
		const waitMs = Math.ceil((needed * 1000) / this.refillPerSec);
		await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
		this.refill();
		this.tokens = Math.max(0, this.tokens - 1);
	}

	private refill(): void {
		const now = Date.now();
		const elapsed = (now - this.lastRefill) / 1000;
		this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSec);
		this.lastRefill = now;
	}
}

export const nominatimBucket = new TokenBucket(2, 1);
