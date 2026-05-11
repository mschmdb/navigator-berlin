import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('debounce', () => {
	it('delayed Call nach ms', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d('x');
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledWith('x');
	});

	it('Cancel + Re-Schedule bei Re-Call', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d('a');
		vi.advanceTimersByTime(50);
		d('b');
		vi.advanceTimersByTime(50);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(50);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('b');
	});

	it('Multi-Calls innerhalb Window: nur letztes Argument', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d(1);
		d(2);
		d(3);
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(3);
	});

	it('Separater Cycle nach Idle', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d('a');
		vi.advanceTimersByTime(150);
		d('b');
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(2);
		expect(fn).toHaveBeenNthCalledWith(1, 'a');
		expect(fn).toHaveBeenNthCalledWith(2, 'b');
	});
});
