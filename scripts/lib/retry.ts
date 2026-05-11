export interface RetryOptions {
	attempts?: number;
	baseDelayMs?: number;
	signal?: AbortSignal;
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
	new Promise((resolve, reject) => {
		const t = setTimeout(resolve, ms);
		signal?.addEventListener('abort', () => {
			clearTimeout(t);
			reject(new Error('aborted'));
		});
	});

export async function withRetry<T>(
	fn: (attempt: number) => Promise<T>,
	options: RetryOptions = {}
): Promise<T> {
	const attempts = options.attempts ?? 3;
	const base = options.baseDelayMs ?? 1000;
	let lastError: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			return await fn(i + 1);
		} catch (err) {
			lastError = err;
			if (i === attempts - 1) break;
			await sleep(base * 2 ** i, options.signal);
		}
	}
	throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
