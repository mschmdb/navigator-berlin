export const GLOBAL_LIVE_ID_POLITE = 'global-aria-live';
export const GLOBAL_LIVE_ID_ASSERTIVE = 'global-aria-live-assertive';

const DEFAULT_CLEAR_AFTER_MS = 5000;

export type LiveLevel = 'polite' | 'assertive';

export interface AnnounceOptions {
	clearAfterMs?: number;
}

const clearTimers: Record<LiveLevel, ReturnType<typeof setTimeout> | null> = {
	polite: null,
	assertive: null
};

function elementFor(level: LiveLevel): HTMLElement | null {
	if (typeof document === 'undefined') return null;
	const id = level === 'assertive' ? GLOBAL_LIVE_ID_ASSERTIVE : GLOBAL_LIVE_ID_POLITE;
	return document.getElementById(id);
}

function cancel(level: LiveLevel): void {
	const t = clearTimers[level];
	if (t !== null) {
		clearTimeout(t);
		clearTimers[level] = null;
	}
}

export function announceGlobal(
	text: string,
	level: LiveLevel = 'polite',
	options: AnnounceOptions = {}
): void {
	const el = elementFor(level);
	if (!el) return;
	cancel(level);
	el.textContent = text;
	const delay = options.clearAfterMs ?? DEFAULT_CLEAR_AFTER_MS;
	if (delay > 0) {
		clearTimers[level] = setTimeout(() => {
			const current = elementFor(level);
			if (current) current.textContent = '';
			clearTimers[level] = null;
		}, delay);
	}
}

export function clearGlobalLive(level: LiveLevel = 'polite'): void {
	cancel(level);
	const el = elementFor(level);
	if (el) el.textContent = '';
}
