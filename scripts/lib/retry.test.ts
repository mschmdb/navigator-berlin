import { describe, expect, it, vi } from 'vitest';
import { withRetry } from './retry.js';

describe('withRetry', () => {
	it('returnt Erfolg beim 1. Versuch ohne Delay', async () => {
		const fn = vi.fn(async () => 'ok');
		const result = await withRetry(fn);
		expect(result).toBe('ok');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('retried bis Erfolg', async () => {
		let calls = 0;
		const fn = vi.fn(async () => {
			calls++;
			if (calls < 3) throw new Error('temp');
			return 'done';
		});
		const result = await withRetry(fn, { baseDelayMs: 5 });
		expect(result).toBe('done');
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it('wirft nach Max-Attempts', async () => {
		const fn = vi.fn(async () => {
			throw new Error('fail');
		});
		await expect(withRetry(fn, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('fail');
		expect(fn).toHaveBeenCalledTimes(2);
	});

	it('expo-backoff: 2 Versuche brauchen mind. baseDelayMs Wartezeit', async () => {
		let calls = 0;
		const fn = vi.fn(async () => {
			calls++;
			if (calls < 2) throw new Error('temp');
			return 'ok';
		});
		const t0 = Date.now();
		await withRetry(fn, { baseDelayMs: 50 });
		const elapsed = Date.now() - t0;
		expect(elapsed).toBeGreaterThanOrEqual(45);
	});

	it('uebergibt attempt-Index an fn', async () => {
		const seen: number[] = [];
		const fn = vi.fn(async (n: number) => {
			seen.push(n);
			if (n < 3) throw new Error('temp');
			return n;
		});
		await withRetry(fn, { baseDelayMs: 1 });
		expect(seen).toEqual([1, 2, 3]);
	});
});
