import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenBucket } from './rate-limit.js';

beforeEach(() => {
	vi.useFakeTimers();
});
afterEach(() => {
	vi.useRealTimers();
});

describe('TokenBucket', () => {
	it('take resolves immediately wenn Tokens vorhanden', async () => {
		const b = new TokenBucket(2, 1);
		await expect(b.take()).resolves.toBeUndefined();
		await expect(b.take()).resolves.toBeUndefined();
	});

	it('Burst-Capacity: 2 takes ohne wait', async () => {
		const b = new TokenBucket(2, 1);
		const start = Date.now();
		await b.take();
		await b.take();
		expect(Date.now() - start).toBeLessThan(50);
	});

	it('3. take ist bis 1s blockiert (Refill-Rate 1/s)', async () => {
		const b = new TokenBucket(2, 1);
		await b.take();
		await b.take();
		const pending = b.take();
		let resolved = false;
		pending.then(() => {
			resolved = true;
		});
		await vi.advanceTimersByTimeAsync(500);
		expect(resolved).toBe(false);
		await vi.advanceTimersByTimeAsync(700);
		await pending;
		expect(resolved).toBe(true);
	});

	it('Refill nach Idle wieder voll', async () => {
		const b = new TokenBucket(2, 1);
		await b.take();
		await b.take();
		await vi.advanceTimersByTimeAsync(5000);
		const start = Date.now();
		await b.take();
		await b.take();
		expect(Date.now() - start).toBeLessThan(50);
	});

	it('Refill respektiert capacity (kein Overflow)', async () => {
		const b = new TokenBucket(2, 1);
		await vi.advanceTimersByTimeAsync(10000);
		await b.take();
		await b.take();
		const pending = b.take();
		let resolved = false;
		pending.then(() => (resolved = true));
		await vi.advanceTimersByTimeAsync(500);
		expect(resolved).toBe(false);
		await vi.advanceTimersByTimeAsync(700);
		await pending;
	});
});
